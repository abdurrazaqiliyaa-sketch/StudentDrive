import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireEmailVerified, requireOnboarding, generateVerificationToken, hashPassword } from "./auth";
import { sendVerificationEmail } from "./email";
import {
  insertCourseSchema,
  insertMaterialSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertBookmarkSchema,
  insertInstitutionSchema,
  insertProgrammeSchema,
  insertMaterialReviewSchema,
  insertMaterialRatingSchema,
  insertMaterialReportSchema,
  type Programme,
} from "@shared/schema";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const baseOnboardingSchema = z.object({
  role: z.enum(["student", "instructor", "institution", "admin"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  institutionId: z.string().optional(),
  bio: z.string().optional(),
});

const studentOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("student"),
  institutionId: z.string().min(1, "Please select your institution").transform(val => val === "no-institution" ? null : val),
  currentLevel: z.number().min(100).max(900),
  yearOfAdmission: z.number().min(2011).max(new Date().getFullYear()),
  expectedGraduationYear: z.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 8),
  modeOfStudy: z.enum(["Full-time", "Part-time"]),
  programmeId: z.string().min(1, "Programme is required"),
  studyGoals: z.array(z.string()).min(2, "Please select at least 2 study goals"),
  learningStyle: z.array(z.string()).min(2, "Please select at least 2 learning styles"),
  studySchedule: z.array(z.string()).min(1, "Please select at least 1 study schedule"),
});

const instructorOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("instructor"),
  institutionId: z.string().min(1, "Please select your institution").transform(val => val === "no-institution" ? null : val),
  specialization: z.array(z.string()).min(1, "Please select at least 1 specialization"),
  yearsOfExperience: z.number().min(0).max(50),
  teachingSubjects: z.array(z.string()).min(1, "Please select at least 1 subject"),
  qualifications: z.array(z.string()).min(1, "Please select at least 1 qualification"),
  teachingMethods: z.array(z.string()).min(1, "Please select at least 1 teaching method"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
});

const institutionOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("institution"),
  institutionName: z.string().min(2, "Institution name is required"),
  institutionType: z.string().min(1, "Institution type is required"),
  numberOfStudents: z.number().min(1),
  departments: z.array(z.string()).min(1, "Please select at least 1 department"),
  institutionAddress: z.string().min(5, "Address is required"),
  institutionPhone: z.string().min(10, "Valid phone number is required"),
  bio: z.string().min(20, "Description must be at least 20 characters"),
});

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  const getBaseUrl = (req: Request) => {
    if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      return `https://${domain}`;
    }
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
  };

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
        onboardingCompleted: false,
      });

      res.json({ 
        message: "Registration successful! You can now log in.",
        userId: user.id,
        success: true
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const users = await storage.getAllUsers();
      const user = users.find(u => u.verificationToken === token);

      if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Verification token expired" });
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ message: "Login successful", user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/onboarding", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { role } = req.body;
      
      let data;
      if (role === "student") {
        data = studentOnboardingSchema.parse(req.body);
        
        // Verify that the selected programme belongs to the selected institution
        if (data.programmeId && data.institutionId && data.institutionId !== "no-institution") {
          const programme = await storage.getProgramme(data.programmeId);
          if (!programme) {
            return res.status(400).json({ message: "Invalid programme selected" });
          }
          if (programme.institutionId !== data.institutionId) {
            return res.status(400).json({ message: "Selected programme does not belong to the selected institution" });
          }
        }
        
        await storage.updateUser(req.user.id, {
          ...data,
          onboardingCompleted: true,
        });
      } else if (role === "instructor") {
        data = instructorOnboardingSchema.parse(req.body);
        
        await storage.updateUser(req.user.id, {
          ...data,
          onboardingCompleted: true,
        });
      } else if (role === "institution") {
        data = institutionOnboardingSchema.parse(req.body);
        
        // Create institution in institutions table and link user
        const institutionData = {
          name: data.institutionName,
          description: data.bio,
          website: null,
          logoUrl: null,
        };
        
        const { institution, user: updatedUser } = await storage.createInstitutionWithOwner(
          institutionData,
          req.user.id,
          data
        );
        
        return res.json({ 
          message: "Onboarding completed", 
          user: updatedUser,
          institution 
        });
      } else {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.getUser(req.user.id);
      res.json({ message: "Onboarding completed", user: updatedUser });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      res.status(400).json({ message: error.message || "Onboarding failed" });
    }
  });

  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
      });

      const data = updateSchema.parse(req.body);
      await storage.updateUser(req.user.id, data);

      const updatedUser = await storage.getUser(req.user.id);
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.post("/api/auth/change-password", isAuthenticated, async (req: any, res: Response) => {
    try {
      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      });

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user.id, { password: hashedNewPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Password change error:", error);
      res.status(400).json({ message: error.message || "Failed to change password" });
    }
  });

  app.get("/api/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { courseId, level, semester, topic, materialType, uploaderRole, search, sortBy, page, limit } = req.query;
      let materials = await storage.getMaterialsWithStats();
      
      // Filter to only show approved materials for non-admin users
      // Admins can see all materials for moderation purposes
      if (req.user.role !== 'admin') {
        materials = materials.filter(m => m.moderationStatus === 'approved');
      }
      
      // Apply filters
      if (courseId) {
        materials = materials.filter(m => m.courseId === courseId);
      }
      if (level) {
        materials = materials.filter(m => m.level === parseInt(level as string));
      }
      if (semester) {
        materials = materials.filter(m => m.semester === parseInt(semester as string));
      }
      if (topic) {
        materials = materials.filter(m => m.topic?.toLowerCase().includes((topic as string).toLowerCase()));
      }
      if (materialType) {
        materials = materials.filter(m => m.materialType === materialType);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        materials = materials.filter(m => 
          m.title.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by uploader role if specified
      if (uploaderRole) {
        const userIds = materials.map(m => m.uploadedById).filter(Boolean) as string[];
        const uniqueUserIds = Array.from(new Set(userIds));
        const uploaders = await Promise.all(
          uniqueUserIds.map(id => storage.getUser(id))
        );
        const uploaderMap = new Map(uploaders.filter(Boolean).map(u => [u!.id, u!.role]));
        materials = materials.filter(m => m.uploadedById && uploaderMap.get(m.uploadedById) === uploaderRole);
      }
      
      // Apply sorting
      if (sortBy) {
        switch (sortBy) {
          case 'newest':
            materials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            materials.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'highest_rated':
            materials.sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0));
            break;
          case 'most_reviewed':
            materials.sort((a, b) => (b.stats?.reviewCount || 0) - (a.stats?.reviewCount || 0));
            break;
          case 'alphabetical':
            materials.sort((a, b) => a.title.localeCompare(b.title));
            break;
          default:
            // Default is newest (already sorted by createdAt desc)
            break;
        }
      }
      
      // Apply pagination
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const pageLimit = Math.max(1, Math.min(100, parseInt(limit as string) || 25)); // Clamp between 1 and 100
      const startIndex = (pageNum - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      const total = materials.length;
      const paginatedMaterials = materials.slice(startIndex, endIndex);
      
      // Get all distinct topics from all materials (before pagination)
      const allTopics = Array.from(new Set(
        materials
          .map(m => m.topic)
          .filter((topic): topic is string => Boolean(topic))
      ));

      res.json({
        materials: paginatedMaterials,
        pagination: {
          page: pageNum,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit),
        },
        topics: allTopics,
      });
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/recent", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      let materials = await storage.getMaterials();
      
      // Filter to only show approved materials for non-admin users
      if (req.user.role !== 'admin') {
        materials = materials.filter(m => m.moderationStatus === 'approved');
      }
      
      res.json(materials.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent materials:", error);
      res.status(500).json({ message: "Failed to fetch recent materials" });
    }
  });

  app.get("/api/materials/my-library", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const materials = await storage.getMaterialsByUser(req.user.id);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching user materials:", error);
      res.status(500).json({ message: "Failed to fetch your materials" });
    }
  });

  app.get("/api/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      let material = await storage.getMaterial(req.params.id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Filter to only show approved materials for non-admin users
      if (req.user.role !== 'admin' && material.moderationStatus !== 'approved') {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Increment view count and get updated material
      await storage.updateMaterial(req.params.id, {
        viewCount: (material.viewCount || 0) + 1
      });
      
      // Fetch the updated material to get the correct view count
      material = await storage.getMaterial(req.params.id) || material;
      
      // Fetch uploader info
      let uploadedBy = null;
      if (material.uploadedById) {
        const uploader = await storage.getUser(material.uploadedById);
        if (uploader) {
          uploadedBy = {
            id: uploader.id,
            firstName: uploader.firstName,
            lastName: uploader.lastName,
            role: uploader.role,
          };
        }
      }
      
      // Fetch course info
      let course = null;
      if (material.courseId) {
        const courseData = await storage.getCourse(material.courseId);
        if (courseData) {
          course = {
            title: courseData.title,
          };
        }
      }
      
      res.json({
        ...material,
        uploadedBy,
        course,
      });
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  app.post("/api/upload", isAuthenticated, requireOnboarding, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/materials/${req.file.filename}`;
      const fileSize = req.file.size;
      const originalFilename = req.file.originalname;
      
      res.json({
        fileUrl,
        fileSize,
        originalFilename,
        fileType: path.extname(req.file.originalname).substring(1).toLowerCase()
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(400).json({ message: error.message || "Failed to upload file" });
    }
  });

  app.post("/api/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertMaterialSchema.parse({ 
        ...req.body, 
        uploadedById: req.user.id,
        institutionId: req.user.institutionId,
        programmeId: req.user.programmeId
      });
      const material = await storage.createMaterial(data);
      res.json(material);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(400).json({ message: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check ownership
      if (material.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You can only edit your own materials" });
      }
      
      const data = insertMaterialSchema.partial().parse(req.body);
      const updatedMaterial = await storage.updateMaterial(req.params.id, data);
      res.json(updatedMaterial);
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(400).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check ownership
      if (material.uploadedById !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own materials" });
      }
      
      await storage.deleteMaterial(req.params.id);
      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  app.post("/api/materials/:id/download", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Increment download count
      await storage.updateMaterial(req.params.id, {
        downloadCount: (material.downloadCount || 0) + 1
      });
      
      res.json({ message: "Download tracked successfully" });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ message: "Failed to track download" });
    }
  });

  app.get("/api/courses", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(data);
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  app.post("/api/courses/bulk", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { courses: coursesData } = req.body;

      if (!Array.isArray(coursesData) || coursesData.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of courses." });
      }

      // Validate each course item
      const validatedCourses = coursesData.map((course, index) => {
        try {
          return insertCourseSchema.parse(course);
        } catch (error) {
          throw new Error(`Invalid data at row ${index + 1}: ${error instanceof Error ? error.message : 'Validation failed'}`);
        }
      });

      const result = await storage.bulkCreateCourses(validatedCourses);

      res.json({
        success: true,
        added: result.added,
        skipped: result.skipped,
        message: `${result.added} course${result.added !== 1 ? 's' : ''} added successfully${result.skipped > 0 ? `, ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped` : ''}.`,
      });
    } catch (error: any) {
      console.error("Error bulk creating courses:", error);
      res.status(400).json({ message: error.message || "Failed to bulk create courses" });
    }
  });

  app.get("/api/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      const quizzesWithCount = await Promise.all(
        quizzes.map(async (quiz) => {
          const questions = await storage.getQuizQuestions(quiz.id);
          return { ...quiz, questionsCount: questions.length };
        })
      );
      res.json(quizzesWithCount);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/upcoming", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizzes = await storage.getQuizzes();
      const quizzesWithCount = await Promise.all(
        quizzes.slice(0, 5).map(async (quiz) => {
          const questions = await storage.getQuizQuestions(quiz.id);
          return { ...quiz, questionsCount: questions.length };
        })
      );
      res.json(quizzesWithCount);
    } catch (error) {
      console.error("Error fetching upcoming quizzes:", error);
      res.status(500).json({ message: "Failed to fetch upcoming quizzes" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.get("/api/quizzes/:id/questions", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const questions = await storage.getQuizQuestions(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post("/api/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const { questions, ...quizData } = req.body;
      
      const data = insertQuizSchema.parse({ ...quizData, createdById: req.user.id });
      const quiz = await storage.createQuiz(data);

      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const questionData = insertQuizQuestionSchema.parse({
            ...questions[i],
            quizId: quiz.id,
            order: i + 1,
          });
          await storage.createQuizQuestion(questionData);
        }
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  app.post("/api/quizzes/:id/submit", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizId = req.params.id;
      const { answers } = req.body;

      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await storage.getQuizQuestions(quizId);
      
      let correctCount = 0;
      questions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
          correctCount++;
        }
      });

      const totalQuestions = questions.length;
      const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
      const passed = scorePercentage >= (quiz.passingScore || 70);

      const attempt = await storage.createQuizAttempt({
        quizId,
        studentId: req.user.id,
        answers,
        score: correctCount,
        totalQuestions,
        passed,
      });

      res.json({
        ...attempt,
        scorePercentage,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  app.get("/api/quiz-attempts", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/quiz-attempts/recent", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      res.json(attempts.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch recent quiz attempts" });
    }
  });

  app.get("/api/bookmarks", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const bookmarks = await storage.getBookmarks(req.user.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertBookmarkSchema.parse({ ...req.body, userId: req.user.id });
      const bookmark = await storage.createBookmark(data);
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(400).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteBookmark(req.params.id);
      res.json({ message: "Bookmark deleted" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  app.delete("/api/bookmarks/by-material/:materialId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteBookmarkByMaterial(req.user.id, req.params.materialId);
      res.json({ message: "Bookmark removed" });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  app.get("/api/bookmarks/check/:materialId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const bookmark = await storage.getBookmarkByMaterial(req.user.id, req.params.materialId);
      res.json({ bookmarked: !!bookmark, bookmark });
    } catch (error) {
      console.error("Error checking bookmark:", error);
      res.status(500).json({ message: "Failed to check bookmark status" });
    }
  });

  // Material Reviews API
  app.get("/api/materials/:materialId/reviews", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const reviews = await storage.getReviewsByMaterial(req.params.materialId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/materials/:materialId/reviews", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const existingReview = await storage.getReviewByUserAndMaterial(req.user.id, req.params.materialId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this material" });
      }
      const data = insertMaterialReviewSchema.parse({
        materialId: req.params.materialId,
        userId: req.user.id,
        reviewText: req.body.reviewText,
      });
      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });

  app.put("/api/reviews/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const review = await storage.updateReview(req.params.id, req.body.reviewText);
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(400).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteReview(req.params.id);
      res.json({ message: "Review deleted" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Material Ratings API
  app.get("/api/materials/:materialId/ratings", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const ratings = await storage.getRatingsByMaterial(req.params.materialId);
      const average = await storage.getAverageRating(req.params.materialId);
      const userRating = await storage.getRatingByUserAndMaterial(req.user.id, req.params.materialId);
      res.json({ ratings, average, userRating, count: ratings.length });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.post("/api/materials/:materialId/ratings", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const existingRating = await storage.getRatingByUserAndMaterial(req.user.id, req.params.materialId);
      
      if (existingRating) {
        const updated = await storage.updateRating(existingRating.id, req.body.rating);
        return res.json(updated);
      }

      const data = insertMaterialRatingSchema.parse({
        materialId: req.params.materialId,
        userId: req.user.id,
        rating: req.body.rating,
      });
      const rating = await storage.createRating(data);
      res.json(rating);
    } catch (error) {
      console.error("Error creating/updating rating:", error);
      res.status(400).json({ message: "Failed to create/update rating" });
    }
  });

  app.delete("/api/ratings/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      await storage.deleteRating(req.params.id);
      res.json({ message: "Rating deleted" });
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  // Material Reports API
  app.post("/api/materials/:materialId/reports", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const data = insertMaterialReportSchema.parse({
        materialId: req.params.materialId,
        userId: req.user.id,
        reason: req.body.reason,
        description: req.body.description,
        status: "pending",
      });
      const report = await storage.createReport(data);
      res.json({ message: "Report submitted successfully", report });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: "Failed to submit report" });
    }
  });

  app.get("/api/admin/reports", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const status = req.query.status as string | undefined;
      const reports = await storage.getAllReports(status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/reports/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const report = await storage.updateReportStatus(
        req.params.id,
        req.body.status,
        req.user.id,
        req.body.adminNotes
      );
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(400).json({ message: "Failed to update report" });
    }
  });

  app.get("/api/student/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      const bookmarks = await storage.getBookmarks(req.user.id);
      const materials = await storage.getMaterials();
      
      const quizzesCompleted = attempts.length;
      const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
        : 0;
      const achievementsCount = attempts.filter(a => a.passed).length;
      const completionRate = attempts.length > 0
        ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
        : 0;

      const uniqueDates = new Set(attempts.map(a => 
        new Date(a.completedAt!).toDateString()
      ));
      const studyStreak = uniqueDates.size;

      res.json({
        materialsCount: bookmarks.length,
        quizzesCompleted,
        averageScore,
        achievementsCount,
        completionRate,
        studyStreak,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Failed to fetch student stats" });
    }
  });

  app.get("/api/student/achievements", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      const achievements = [];

      if (attempts.length >= 1) {
        achievements.push({ name: "First Steps", description: "Complete your first quiz", icon: "trophy" });
      }
      if (attempts.length >= 10) {
        achievements.push({ name: "Quiz Master", description: "Complete 10 quizzes", icon: "star" });
      }
      if (attempts.filter(a => a.passed).length >= 5) {
        achievements.push({ name: "High Achiever", description: "Pass 5 quizzes", icon: "award" });
      }

      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/student/performance", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user.id);
      
      // Basic stats
      const averageScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
        : 0;
      const completionRate = attempts.length > 0
        ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
        : 0;

      const uniqueDates = new Set(attempts.map(a => 
        new Date(a.completedAt!).toDateString()
      ));

      // Weekly performance trends (last 8 weeks)
      const weeklyData = [];
      const now = new Date();
      
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekAttempts = attempts.filter(a => {
          const attemptDate = new Date(a.completedAt!);
          return attemptDate >= weekStart && attemptDate <= weekEnd;
        });
        
        const weekScore = weekAttempts.length > 0
          ? Math.round(weekAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / weekAttempts.length)
          : null;
        
        if (weekScore !== null || i >= 4) { // Show last 4 weeks even if no data
          weeklyData.push({
            name: `Week ${8 - i}`,
            score: weekScore || 0,
            attempts: weekAttempts.length,
          });
        }
      }

      // Course-based performance
      const coursePerformance: Record<string, { scores: number[], courseTitle: string }> = {};
      
      for (const attempt of attempts) {
        const quiz = await storage.getQuiz(attempt.quizId!);
        if (quiz && quiz.courseId) {
          const course = await storage.getCourse(quiz.courseId);
          if (course) {
            if (!coursePerformance[quiz.courseId]) {
              coursePerformance[quiz.courseId] = {
                scores: [],
                courseTitle: course.title,
              };
            }
            const percentage = (attempt.score / attempt.totalQuestions) * 100;
            coursePerformance[quiz.courseId].scores.push(percentage);
          }
        }
      }

      const courseData = Object.entries(coursePerformance).map(([courseId, data]) => ({
        course: data.courseTitle,
        score: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length),
        attempts: data.scores.length,
      })).sort((a, b) => b.score - a.score);

      // Identify strengths (>80%) and weaknesses (<75%)
      const strengths = courseData.filter(c => c.score >= 80).slice(0, 3);
      const weaknesses = courseData.filter(c => c.score < 75).slice(0, 3);

      res.json({
        averageScore,
        completionRate,
        studyStreak: uniqueDates.size,
        timeSpent: Math.round((attempts.length * 15) / 60), // Convert minutes to hours
        weeklyTrend: weeklyData.length > 0 ? weeklyData : [
          { name: "Week 1", score: 0, attempts: 0 },
          { name: "Week 2", score: 0, attempts: 0 },
          { name: "Week 3", score: 0, attempts: 0 },
          { name: "Week 4", score: 0, attempts: 0 },
        ],
        coursePerformance: courseData,
        strengths,
        weaknesses,
      });
    } catch (error) {
      console.error("Error fetching performance:", error);
      res.status(500).json({ message: "Failed to fetch performance" });
    }
  });

  app.get("/api/instructor/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const materials = await storage.getMaterialsByInstructor(req.user.id);
      const quizzes = await storage.getQuizzesByInstructor(req.user.id);
      const courses = await storage.getCourses();
      const instructorCourses = courses.filter(c => c.instructorId === req.user.id);

      let totalAttempts = 0;
      let totalScore = 0;
      
      for (const quiz of quizzes) {
        const attempts = await storage.getQuizAttemptsByQuiz(quiz.id);
        totalAttempts += attempts.length;
        totalScore += attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0);
      }

      const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

      const allAttempts = await Promise.all(
        quizzes.map(q => storage.getQuizAttemptsByQuiz(q.id))
      );
      const uniqueStudents = new Set(allAttempts.flat().map(a => a.studentId));

      res.json({
        coursesCount: instructorCourses.length,
        materialsCount: materials.length,
        studentsCount: uniqueStudents.size,
        avgScore,
      });
    } catch (error) {
      console.error("Error fetching instructor stats:", error);
      res.status(500).json({ message: "Failed to fetch instructor stats" });
    }
  });

  app.get("/api/instructor/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const materials = await storage.getMaterialsByInstructor(req.user.id);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching instructor materials:", error);
      res.status(500).json({ message: "Failed to fetch instructor materials" });
    }
  });

  app.get("/api/instructor/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const quizzes = await storage.getQuizzesByInstructor(req.user.id);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching instructor quizzes:", error);
      res.status(500).json({ message: "Failed to fetch instructor quizzes" });
    }
  });

  app.get("/api/institution/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(u => u.role === "student" && u.institutionId === req.user.institutionId);
      const instructors = allUsers.filter(u => u.role === "instructor" && u.institutionId === req.user.institutionId);
      const courses = await storage.getCourses();
      const institutionCourses = courses.filter(c => c.institutionId === req.user.institutionId);

      let totalScore = 0;
      let totalAttempts = 0;

      for (const student of students) {
        const attempts = await storage.getQuizAttempts(student.id);
        totalAttempts += attempts.length;
        totalScore += attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0);
      }

      const avgPerformance = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

      res.json({
        studentsCount: students.length,
        instructorsCount: instructors.length,
        coursesCount: institutionCourses.length,
        avgPerformance,
      });
    } catch (error) {
      console.error("Error fetching institution stats:", error);
      res.status(500).json({ message: "Failed to fetch institution stats" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const institutions = await storage.getInstitutions();
      const materials = await storage.getMaterials();
      const quizzes = await storage.getQuizzes();

      const activeUsers = allUsers.filter(u => u.onboardingCompleted).length;
      const totalUsers = allUsers.length;
      const activityRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

      res.json({
        totalUsers,
        institutionsCount: institutions.length,
        contentCount: materials.length + quizzes.length,
        activityRate,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/institutions", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.post("/api/admin/institutions", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const data = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(data);
      res.json(institution);
    } catch (error: any) {
      console.error("Error creating institution:", error);
      res.status(400).json({ message: error.message || "Failed to create institution" });
    }
  });

  app.post("/api/admin/institutions/bulk", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { institutions: institutionsData } = req.body;

      if (!Array.isArray(institutionsData) || institutionsData.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of institutions." });
      }

      const result = await storage.bulkCreateInstitutions(institutionsData);

      res.json({
        success: true,
        added: result.added,
        skipped: result.skipped,
        message: `${result.added} institution${result.added !== 1 ? 's' : ''} added successfully${result.skipped > 0 ? `, ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped` : ''}.`,
      });
    } catch (error: any) {
      console.error("Error bulk creating institutions:", error);
      res.status(400).json({ message: error.message || "Failed to bulk create institutions" });
    }
  });

  app.get("/api/institutions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.get("/api/institutions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const institution = await storage.getInstitution(id);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }
      res.json(institution);
    } catch (error) {
      console.error("Error fetching institution:", error);
      res.status(500).json({ message: "Failed to fetch institution" });
    }
  });

  // Institution Management Routes (for institution role)
  app.get("/api/institution/stats", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const students = await storage.getStudentsByInstitution(req.user.institutionId);
      const instructors = await storage.getInstructorsByInstitution(req.user.institutionId);
      const courses = await storage.getCoursesByInstitution(req.user.institutionId);
      const programmes = await storage.getProgrammesByInstitution(req.user.institutionId);

      res.json({
        studentsCount: students.length,
        instructorsCount: instructors.length,
        coursesCount: courses.length,
        programmesCount: programmes.length,
        averagePerformance: 0,
      });
    } catch (error) {
      console.error("Error fetching institution stats:", error);
      res.status(500).json({ message: "Failed to fetch institution stats" });
    }
  });

  app.get("/api/institution/instructors", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const instructors = await storage.getInstructorsByInstitution(req.user.institutionId);
      
      // Sanitize to remove sensitive fields
      const sanitizedInstructors = instructors.map(instructor => ({
        id: instructor.id,
        email: instructor.email,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        gender: instructor.gender,
        specialization: instructor.specialization,
        yearsOfExperience: instructor.yearsOfExperience,
        teachingSubjects: instructor.teachingSubjects,
        qualifications: instructor.qualifications,
        teachingMethods: instructor.teachingMethods,
        bio: instructor.bio,
        onboardingCompleted: instructor.onboardingCompleted,
        createdAt: instructor.createdAt,
      }));
      
      res.json(sanitizedInstructors);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get("/api/institution/students", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const students = await storage.getStudentsByInstitution(req.user.institutionId);
      
      // Sanitize to remove sensitive fields
      const sanitizedStudents = students.map(student => ({
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        currentLevel: student.currentLevel,
        yearOfAdmission: student.yearOfAdmission,
        expectedGraduationYear: student.expectedGraduationYear,
        modeOfStudy: student.modeOfStudy,
        programmeId: student.programmeId,
        studyGoals: student.studyGoals,
        learningStyle: student.learningStyle,
        studySchedule: student.studySchedule,
        onboardingCompleted: student.onboardingCompleted,
        createdAt: student.createdAt,
      }));
      
      res.json(sanitizedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/institution/programmes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const programmes = await storage.getProgrammesByInstitution(req.user.institutionId);
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  app.post("/api/institution/programmes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'institution') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.user.institutionId) {
        return res.status(400).json({ message: "Institution not linked to user" });
      }

      const data = insertProgrammeSchema.parse({
        ...req.body,
        institutionId: req.user.institutionId,
      });
      const programme = await storage.createProgramme(data);
      res.json(programme);
    } catch (error: any) {
      console.error("Error creating programme:", error);
      res.status(400).json({ message: error.message || "Failed to create programme" });
    }
  });

  // Public route to get programmes by institution (for onboarding)
  app.get("/api/programmes/:institutionId", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { institutionId } = req.params;
      const programmes = await storage.getProgrammesByInstitution(institutionId);
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  // Get single programme by ID
  app.get("/api/programmes/single/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const programme = await storage.getProgramme(id);
      if (!programme) {
        return res.status(404).json({ message: "Programme not found" });
      }
      res.json(programme);
    } catch (error) {
      console.error("Error fetching programme:", error);
      res.status(500).json({ message: "Failed to fetch programme" });
    }
  });

  // Programme Management Routes
  app.get("/api/admin/programmes/:institutionId", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { institutionId } = req.params;
      const programmes = await storage.getProgrammesByInstitution(institutionId);
      res.json(programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      res.status(500).json({ message: "Failed to fetch programmes" });
    }
  });

  app.post("/api/admin/programmes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const data = insertProgrammeSchema.parse(req.body);
      const programme = await storage.createProgramme(data);
      res.json(programme);
    } catch (error: any) {
      console.error("Error creating programme:", error);
      res.status(400).json({ message: error.message || "Failed to create programme" });
    }
  });

  app.post("/api/admin/programmes/bulk", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { institutionId, programmes: programmesData, format } = req.body;
      
      if (!institutionId) {
        return res.status(400).json({ message: "Institution ID is required" });
      }
      
      if (!programmesData || !Array.isArray(programmesData)) {
        return res.status(400).json({ message: "Programmes data must be an array" });
      }

      // Transform data and inject institutionId before validation
      const programmesWithInstitution = programmesData.map((prog: any) => {
        let transformedProg: any;
        
        // If CSV format, map CSV fields to schema fields
        if (format === 'csv') {
          transformedProg = {
            name: prog.name || prog.Name || prog.programme_name,
            code: prog.code || prog.Code || prog.programme_code,
            degree: prog.degree || prog.Degree,
            duration: prog.duration ? parseInt(prog.duration) : (prog.Duration ? parseInt(prog.Duration) : undefined),
            description: prog.description || prog.Description,
          };
        } else {
          // JSON format - use as-is but remove any existing institutionId
          const { institutionId: _, ...rest } = prog;
          transformedProg = rest;
        }
        
        // Always inject the institutionId from the top level to ensure it's correct
        return {
          ...transformedProg,
          institutionId: institutionId, // Explicitly set institutionId
        };
      });

      // Now validate all programmes
      const validatedProgrammes = programmesWithInstitution.map((prog: any) => {
        return insertProgrammeSchema.parse(prog);
      });

      const createdProgrammes = await storage.createProgrammes(validatedProgrammes);
      res.json({ 
        success: true, 
        count: createdProgrammes.length,
        programmes: createdProgrammes 
      });
    } catch (error: any) {
      console.error("Error creating programmes:", error);
      res.status(400).json({ message: error.message || "Failed to create programmes" });
    }
  });

  app.delete("/api/admin/programmes/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { id } = req.params;
      await storage.deleteProgramme(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting programme:", error);
      res.status(400).json({ message: error.message || "Failed to delete programme" });
    }
  });

  // Admin Content Moderation Endpoints
  app.get("/api/admin/content/materials", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      const materials = await storage.getMaterialsForModeration(status as string);
      res.json(materials);
    } catch (error: any) {
      console.error("Error fetching materials for moderation:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/admin/content/quizzes", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.query;
      const quizzes = await storage.getQuizzesForModeration(status as string);
      res.json(quizzes);
    } catch (error: any) {
      console.error("Error fetching quizzes for moderation:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.patch("/api/admin/content/materials/:id/moderate", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }

      const material = await storage.moderateMaterial(id, status, req.user.id, reason);
      res.json({ message: "Material moderated successfully", material });
    } catch (error: any) {
      console.error("Error moderating material:", error);
      res.status(500).json({ message: "Failed to moderate material" });
    }
  });

  app.patch("/api/admin/content/quizzes/:id/moderate", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }

      const quiz = await storage.moderateQuiz(id, status, req.user.id, reason);
      res.json({ message: "Quiz moderated successfully", quiz });
    } catch (error: any) {
      console.error("Error moderating quiz:", error);
      res.status(500).json({ message: "Failed to moderate quiz" });
    }
  });

  app.delete("/api/admin/content/materials/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteMaterial(id);
      res.json({ message: "Material deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  app.delete("/api/admin/content/quizzes/:id", isAuthenticated, requireOnboarding, async (req: any, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteQuiz(id);
      res.json({ message: "Quiz deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
