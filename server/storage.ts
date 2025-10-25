// Referenced from javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  institutions,
  programmes,
  courses,
  materials,
  quizzes,
  quizQuestions,
  quizAttempts,
  bookmarks,
  materialReviews,
  materialRatings,
  materialReports,
  type User,
  type UpsertUser,
  type Institution,
  type InsertInstitution,
  type Programme,
  type InsertProgramme,
  type Course,
  type InsertCourse,
  type Material,
  type InsertMaterial,
  type Quiz,
  type InsertQuiz,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Bookmark,
  type InsertBookmark,
  type MaterialReview,
  type InsertMaterialReview,
  type MaterialRating,
  type InsertMaterialRating,
  type MaterialReport,
  type InsertMaterialReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Institution operations
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  bulkCreateInstitutions(institutionsData: InsertInstitution[]): Promise<{ added: number; skipped: number }>;
  createInstitutionWithOwner(institutionData: InsertInstitution, userId: string, onboardingData: Partial<UpsertUser>): Promise<{ institution: Institution; user: User }>;
  getUsersByInstitution(institutionId: string): Promise<User[]>;
  getInstructorsByInstitution(institutionId: string): Promise<User[]>;
  getStudentsByInstitution(institutionId: string): Promise<User[]>;
  
  // Programme operations
  getProgrammes(): Promise<Programme[]>;
  getProgrammesByInstitution(institutionId: string): Promise<Programme[]>;
  getProgramme(id: string): Promise<Programme | undefined>;
  createProgramme(programme: InsertProgramme): Promise<Programme>;
  createProgrammes(programmes: InsertProgramme[]): Promise<Programme[]>;
  deleteProgramme(id: string): Promise<void>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCoursesByInstitution(institutionId: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  bulkCreateCourses(coursesData: InsertCourse[]): Promise<{ added: number; skipped: number }>;
  
  // Material operations
  getMaterials(): Promise<Material[]>;
  getMaterialsByCourse(courseId: string): Promise<Material[]>;
  getMaterialsByInstructor(instructorId: string): Promise<Material[]>;
  getMaterialsByUser(userId: string): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, material: Partial<InsertMaterial>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  getMaterialsForModeration(status?: string): Promise<Material[]>;
  moderateMaterial(id: string, status: string, moderatorId: string, reason?: string): Promise<Material>;
  
  // Quiz operations
  getQuizzes(): Promise<Quiz[]>;
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  getQuizzesByInstructor(instructorId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizzesForModeration(status?: string): Promise<Quiz[]>;
  moderateQuiz(id: string, status: string, moderatorId: string, reason?: string): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Quiz Question operations
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // Quiz Attempt operations
  getQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  
  // Bookmark operations
  getBookmarks(userId: string): Promise<Bookmark[]>;
  getBookmarkByMaterial(userId: string, materialId: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;
  deleteBookmarkByMaterial(userId: string, materialId: string): Promise<void>;
  
  // Material Review operations
  getReviewsByMaterial(materialId: string): Promise<MaterialReview[]>;
  getReviewByUserAndMaterial(userId: string, materialId: string): Promise<MaterialReview | undefined>;
  createReview(review: InsertMaterialReview): Promise<MaterialReview>;
  updateReview(id: string, reviewText: string): Promise<MaterialReview>;
  deleteReview(id: string): Promise<void>;
  
  // Material Rating operations
  getRatingsByMaterial(materialId: string): Promise<MaterialRating[]>;
  getRatingByUserAndMaterial(userId: string, materialId: string): Promise<MaterialRating | undefined>;
  getAverageRating(materialId: string): Promise<number>;
  createRating(rating: InsertMaterialRating): Promise<MaterialRating>;
  updateRating(id: string, rating: number): Promise<MaterialRating>;
  deleteRating(id: string): Promise<void>;
  
  // Material Report operations
  getReportsByMaterial(materialId: string): Promise<MaterialReport[]>;
  getAllReports(status?: string): Promise<MaterialReport[]>;
  createReport(report: InsertMaterialReport): Promise<MaterialReport>;
  updateReportStatus(id: string, status: string, reviewerId: string, notes?: string): Promise<MaterialReport>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Institution operations
  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions).orderBy(desc(institutions.createdAt));
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution;
  }

  async createInstitution(institutionData: InsertInstitution): Promise<Institution> {
    const [institution] = await db.insert(institutions).values(institutionData).returning();
    return institution;
  }

  async bulkCreateInstitutions(institutionsData: InsertInstitution[]): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const institutionData of institutionsData) {
      try {
        const existingInstitution = await db
          .select()
          .from(institutions)
          .where(eq(institutions.name, institutionData.name))
          .limit(1);

        if (existingInstitution.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(institutions).values(institutionData);
        added++;
      } catch (error) {
        console.error(`Error creating institution ${institutionData.name}:`, error);
        skipped++;
      }
    }

    return { added, skipped };
  }

  async createInstitutionWithOwner(
    institutionData: InsertInstitution, 
    userId: string, 
    onboardingData: Partial<UpsertUser>
  ): Promise<{ institution: Institution; user: User }> {
    const [institution] = await db.insert(institutions).values(institutionData).returning();
    
    const [user] = await db
      .update(users)
      .set({ 
        ...onboardingData, 
        institutionId: institution.id,
        onboardingCompleted: true,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return { institution, user };
  }

  async getUsersByInstitution(institutionId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.institutionId, institutionId));
  }

  async getInstructorsByInstitution(institutionId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.institutionId, institutionId), eq(users.role, 'instructor')));
  }

  async getStudentsByInstitution(institutionId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.institutionId, institutionId), eq(users.role, 'student')));
  }

  // Programme operations
  async getProgrammes(): Promise<Programme[]> {
    return await db.select().from(programmes).orderBy(desc(programmes.createdAt));
  }

  async getProgrammesByInstitution(institutionId: string): Promise<Programme[]> {
    return await db.select().from(programmes).where(eq(programmes.institutionId, institutionId));
  }

  async getProgramme(id: string): Promise<Programme | undefined> {
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id));
    return programme;
  }

  async createProgramme(programmeData: InsertProgramme): Promise<Programme> {
    const [programme] = await db.insert(programmes).values(programmeData).returning();
    return programme;
  }

  async createProgrammes(programmesData: InsertProgramme[]): Promise<Programme[]> {
    const createdProgrammes = await db.insert(programmes).values(programmesData).returning();
    return createdProgrammes;
  }

  async deleteProgramme(id: string): Promise<void> {
    await db.delete(programmes).where(eq(programmes.id, id));
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCoursesByInstitution(institutionId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.institutionId, institutionId));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }

  async bulkCreateCourses(coursesData: InsertCourse[]): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const courseData of coursesData) {
      try {
        const existingCourse = await db
          .select()
          .from(courses)
          .where(
            and(
              eq(courses.title, courseData.title),
              courseData.institutionId ? eq(courses.institutionId, courseData.institutionId) : sql`true`
            )
          )
          .limit(1);

        if (existingCourse.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(courses).values(courseData);
        added++;
      } catch (error) {
        console.error(`Error creating course ${courseData.title}:`, error);
        skipped++;
      }
    }

    return { added, skipped };
  }

  // Material operations
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials).orderBy(desc(materials.createdAt));
  }

  async getMaterialsWithStats(): Promise<any[]> {
    const result = await db
      .select({
        material: materials,
        avgRating: sql<number>`COALESCE(AVG(${materialRatings.rating}), 0)`.as('avg_rating'),
        ratingCount: sql<number>`COUNT(DISTINCT ${materialRatings.id})`.as('rating_count'),
        reviewCount: sql<number>`COUNT(DISTINCT ${materialReviews.id})`.as('review_count'),
      })
      .from(materials)
      .leftJoin(materialRatings, eq(materials.id, materialRatings.materialId))
      .leftJoin(materialReviews, eq(materials.id, materialReviews.materialId))
      .groupBy(materials.id)
      .orderBy(desc(materials.createdAt));

    return result.map(row => ({
      ...row.material,
      stats: {
        averageRating: parseFloat(String(row.avgRating)),
        ratingCount: parseInt(String(row.ratingCount)),
        reviewCount: parseInt(String(row.reviewCount)),
      }
    }));
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async getMaterialsByInstructor(instructorId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.uploadedById, instructorId));
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async createMaterial(materialData: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(materialData).returning();
    return material;
  }

  async getMaterialsByUser(userId: string): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.uploadedById, userId))
      .orderBy(desc(materials.createdAt));
  }

  async updateMaterial(id: string, materialData: Partial<InsertMaterial>): Promise<Material> {
    const [material] = await db
      .update(materials)
      .set({ ...materialData, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  async deleteMaterial(id: string): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  async getMaterialsForModeration(status?: string): Promise<Material[]> {
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      return await db
        .select()
        .from(materials)
        .where(eq(materials.moderationStatus, status))
        .orderBy(desc(materials.createdAt));
    }
    return await db.select().from(materials).orderBy(desc(materials.createdAt));
  }

  async moderateMaterial(id: string, status: string, moderatorId: string, reason?: string): Promise<Material> {
    const [material] = await db
      .update(materials)
      .set({
        moderationStatus: status,
        moderatedById: moderatorId,
        moderatedAt: new Date(),
        moderationNotes: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  // Quiz operations
  async getQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuizzesByInstructor(instructorId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.createdById, instructorId));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(quizData).returning();
    return quiz;
  }

  async getQuizzesForModeration(status?: string): Promise<Quiz[]> {
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      return await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.moderationStatus, status))
        .orderBy(desc(quizzes.createdAt));
    }
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async moderateQuiz(id: string, status: string, moderatorId: string, reason?: string): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set({
        moderationStatus: status,
        moderatedById: moderatorId,
        moderatedAt: new Date(),
        moderationNotes: reason || null,
      })
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Quiz Question operations
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.order);
  }

  async createQuizQuestion(questionData: InsertQuizQuestion): Promise<QuizQuestion> {
    const [question] = await db.insert(quizQuestions).values(questionData).returning();
    return question;
  }

  // Quiz Attempt operations
  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.studentId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
  }

  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(attemptData).returning();
    return attempt;
  }

  // Bookmark operations
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async createBookmark(bookmarkData: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db.insert(bookmarks).values(bookmarkData).returning();
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }

  async getBookmarkByMaterial(userId: string, materialId: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)));
    return bookmark;
  }

  async deleteBookmarkByMaterial(userId: string, materialId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.materialId, materialId)));
  }

  // Material Review operations
  async getReviewsByMaterial(materialId: string): Promise<MaterialReview[]> {
    return await db
      .select()
      .from(materialReviews)
      .where(eq(materialReviews.materialId, materialId))
      .orderBy(desc(materialReviews.createdAt));
  }

  async getReviewByUserAndMaterial(userId: string, materialId: string): Promise<MaterialReview | undefined> {
    const [review] = await db
      .select()
      .from(materialReviews)
      .where(and(eq(materialReviews.userId, userId), eq(materialReviews.materialId, materialId)));
    return review;
  }

  async createReview(reviewData: InsertMaterialReview): Promise<MaterialReview> {
    const [review] = await db.insert(materialReviews).values(reviewData).returning();
    return review;
  }

  async updateReview(id: string, reviewText: string): Promise<MaterialReview> {
    const [review] = await db
      .update(materialReviews)
      .set({ reviewText, updatedAt: new Date() })
      .where(eq(materialReviews.id, id))
      .returning();
    return review;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(materialReviews).where(eq(materialReviews.id, id));
  }

  // Material Rating operations
  async getRatingsByMaterial(materialId: string): Promise<MaterialRating[]> {
    return await db
      .select()
      .from(materialRatings)
      .where(eq(materialRatings.materialId, materialId));
  }

  async getRatingByUserAndMaterial(userId: string, materialId: string): Promise<MaterialRating | undefined> {
    const [rating] = await db
      .select()
      .from(materialRatings)
      .where(and(eq(materialRatings.userId, userId), eq(materialRatings.materialId, materialId)));
    return rating;
  }

  async getAverageRating(materialId: string): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`COALESCE(AVG(${materialRatings.rating}), 0)` })
      .from(materialRatings)
      .where(eq(materialRatings.materialId, materialId));
    return result[0]?.avg || 0;
  }

  async createRating(ratingData: InsertMaterialRating): Promise<MaterialRating> {
    const [rating] = await db.insert(materialRatings).values(ratingData).returning();
    return rating;
  }

  async updateRating(id: string, ratingValue: number): Promise<MaterialRating> {
    const [rating] = await db
      .update(materialRatings)
      .set({ rating: ratingValue, updatedAt: new Date() })
      .where(eq(materialRatings.id, id))
      .returning();
    return rating;
  }

  async deleteRating(id: string): Promise<void> {
    await db.delete(materialRatings).where(eq(materialRatings.id, id));
  }

  // Material Report operations
  async getReportsByMaterial(materialId: string): Promise<MaterialReport[]> {
    return await db
      .select()
      .from(materialReports)
      .where(eq(materialReports.materialId, materialId))
      .orderBy(desc(materialReports.createdAt));
  }

  async getAllReports(status?: string): Promise<MaterialReport[]> {
    if (status) {
      return await db
        .select()
        .from(materialReports)
        .where(eq(materialReports.status, status))
        .orderBy(desc(materialReports.createdAt));
    }
    return await db.select().from(materialReports).orderBy(desc(materialReports.createdAt));
  }

  async createReport(reportData: InsertMaterialReport): Promise<MaterialReport> {
    const [report] = await db.insert(materialReports).values(reportData).returning();
    return report;
  }

  async updateReportStatus(id: string, status: string, reviewerId: string, notes?: string): Promise<MaterialReport> {
    const [report] = await db
      .update(materialReports)
      .set({
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        adminNotes: notes,
      })
      .where(eq(materialReports.id, id))
      .returning();
    return report;
  }
}

export const storage = new DatabaseStorage();
