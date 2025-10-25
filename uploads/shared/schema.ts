import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Email/Password Auth with verification
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  gender: varchar("gender", { length: 20 }), // male, female, other, prefer_not_to_say
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }), // student, instructor, institution, admin - null until onboarding
  institutionId: varchar("institution_id").references(() => institutions.id),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  currentLevel: integer("current_level"),
  yearOfAdmission: integer("year_of_admission"),
  expectedGraduationYear: integer("expected_graduation_year"),
  modeOfStudy: varchar("mode_of_study", { length: 50 }),
  programme: varchar("programme"),
  programmeId: varchar("programme_id").references(() => programmes.id),
  studyGoals: text("study_goals").array(),
  learningStyle: text("learning_style").array(),
  studySchedule: text("study_schedule").array(),
  
  // Instructor-specific fields
  specialization: text("specialization").array(),
  yearsOfExperience: integer("years_of_experience"),
  teachingSubjects: text("teaching_subjects").array(),
  qualifications: text("qualifications").array(),
  teachingMethods: text("teaching_methods").array(),
  
  // Institution-specific fields
  institutionName: varchar("institution_name"),
  institutionType: varchar("institution_type"),
  numberOfStudents: integer("number_of_students"),
  departments: text("departments").array(),
  institutionAddress: text("institution_address"),
  institutionPhone: varchar("institution_phone"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  programme: one(programmes, {
    fields: [users.programmeId],
    references: [programmes.id],
  }),
  materials: many(materials),
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  bookmarks: many(bookmarks),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Institutions table
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  courses: many(courses),
  programmes: many(programmes),
}));

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
});

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

// Programmes table
export const programmes = pgTable("programmes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  degree: varchar("degree", { length: 100 }), // Bachelor, Master, Doctorate, Diploma, etc.
  duration: integer("duration"), // duration in years
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programmesRelations = relations(programmes, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [programmes.institutionId],
    references: [institutions.id],
  }),
  users: many(users),
}));

export const insertProgrammeSchema = createInsertSchema(programmes).omit({
  id: true,
  createdAt: true,
});

export type InsertProgramme = z.infer<typeof insertProgrammeSchema>;
export type Programme = typeof programmes.$inferSelect;

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }),
  institutionId: varchar("institution_id").references(() => institutions.id),
  instructorId: varchar("instructor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [courses.institutionId],
    references: [institutions.id],
  }),
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  materials: many(materials),
  quizzes: many(quizzes),
}));

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Materials table
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url"),
  fileType: varchar("file_type", { length: 50 }), // pdf, doc, video, etc.
  materialType: varchar("material_type", { length: 50 }).notNull(), // lecture_notes, textbook, study_guide, past_questions
  courseId: varchar("course_id").references(() => courses.id),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  institutionId: varchar("institution_id").references(() => institutions.id),
  programmeId: varchar("programme_id").references(() => programmes.id),
  level: integer("level"), // 100, 200, 300, 400, etc.
  semester: integer("semester"), // 1, 2
  topic: varchar("topic", { length: 255 }),
  tags: text("tags").array(),
  fileSize: integer("file_size"), // file size in bytes
  originalFilename: varchar("original_filename", { length: 255 }), // original uploaded filename
  moderationStatus: varchar("moderation_status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderatedById: varchar("moderated_by_id").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialsRelations = relations(materials, ({ one, many }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  uploadedBy: one(users, {
    fields: [materials.uploadedById],
    references: [users.id],
  }),
  bookmarks: many(bookmarks),
  reviews: many(materialReviews),
  ratings: many(materialRatings),
  reports: many(materialReports),
}));

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id),
  createdById: varchar("created_by_id").references(() => users.id),
  timeLimit: integer("time_limit"), // in minutes, null = no limit
  passingScore: integer("passing_score").default(70),
  moderationStatus: varchar("moderation_status", { length: 20 }).default("pending"), // pending, approved, rejected
  moderatedById: varchar("moderated_by_id").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  createdBy: one(users, {
    fields: [quizzes.createdById],
    references: [users.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz Questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull(), // mcq, true_false
  options: jsonb("options").notNull(), // Array of options for MCQ
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
});

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

// Quiz Attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id),
  studentId: varchar("student_id").references(() => users.id),
  answers: jsonb("answers").notNull(), // Object mapping question IDs to answers
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  student: one(users, {
    fields: [quizAttempts.studentId],
    references: [users.id],
  }),
}));

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  materialId: varchar("material_id").references(() => materials.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [bookmarks.materialId],
    references: [materials.id],
  }),
}));

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Material Reviews table
export const materialReviews = pgTable("material_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reviewText: text("review_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialReviewsRelations = relations(materialReviews, ({ one }) => ({
  material: one(materials, {
    fields: [materialReviews.materialId],
    references: [materials.id],
  }),
  user: one(users, {
    fields: [materialReviews.userId],
    references: [users.id],
  }),
}));

export const insertMaterialReviewSchema = createInsertSchema(materialReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterialReview = z.infer<typeof insertMaterialReviewSchema>;
export type MaterialReview = typeof materialReviews.$inferSelect;

// Material Ratings table
export const materialRatings = pgTable("material_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialRatingsRelations = relations(materialRatings, ({ one }) => ({
  material: one(materials, {
    fields: [materialRatings.materialId],
    references: [materials.id],
  }),
  user: one(users, {
    fields: [materialRatings.userId],
    references: [users.id],
  }),
}));

export const insertMaterialRatingSchema = createInsertSchema(materialRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaterialRating = z.infer<typeof insertMaterialRatingSchema>;
export type MaterialRating = typeof materialRatings.$inferSelect;

// Material Reports table
export const materialReports = pgTable("material_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reason: varchar("reason", { length: 50 }).notNull(), // inappropriate, spam, copyright, inaccurate, other
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, reviewed, resolved, dismissed
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materialReportsRelations = relations(materialReports, ({ one }) => ({
  material: one(materials, {
    fields: [materialReports.materialId],
    references: [materials.id],
  }),
  user: one(users, {
    fields: [materialReports.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [materialReports.reviewedById],
    references: [users.id],
  }),
}));

export const insertMaterialReportSchema = createInsertSchema(materialReports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export type InsertMaterialReport = z.infer<typeof insertMaterialReportSchema>;
export type MaterialReport = typeof materialReports.$inferSelect;
