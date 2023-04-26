import { StaticImageData } from "next/image";
import { z } from "zod";
export type ThemeType = "dark" | "light";
const ObjectTypes = ["USER", "QUEST", "SOLUTION", "COMMENT", "POST"] as const;
export type ObjectTypesType = typeof ObjectTypes;
const QuestStatus = ["CLOSED", "OPEN"] as const;
export const SolutionStatus = [
  "ACKNOWLEDGED",
  "REJECTED",
  "ACCEPTED",
  "POSTED",
] as const;
const UserRole = ["ADMIN", "USER"] as const;

const QuestAttributes = [
  "title",
  "topic",
  "reward",
  "subtopic",
  "slots",
  "deadline",
  "content",
  "lastUpdated",
] as const;
export const Topics = [
  "MARKETING",
  "BUSINESS",
  "PROGRAMMING",
  "SCIENCE",
  "DESIGN",
  "ART",
  "VIDEOGRAPHY",
] as const;

export const TopicsObject = {
  MARKETING: {
    SOCIAL_MEDIA: false,
  },
  PROGRAMMING: {
    MACHINE_LEARNING: false,
    WEB_DEVELOPMENT: false,
    FRONT_END: false,
    BACK_END: false,
  },
  BUSINESS: {
    FINANCE: false,
    TRADING: false,
  },
};
export type QuestAttributesType = typeof QuestAttributes;
export const Subtopics = ["SOCIAL MEDIA", "MACHINE LEARNING", "WEB3"] as const;
const TopicsZod = z.enum(Topics);
export type TopicsType = z.infer<typeof TopicsZod>;
export type SubtopicsType = typeof Subtopics;

export const UserZod = z.object({
  profile: z.optional(z.string()),
  verified: z.boolean(),
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(UserRole),
  about: z.optional(z.string()),
  balance: z.number(),
  level: z.number(),
  experience: z.number(),
  topics: z.optional(z.array(z.enum(Topics))),
  subtopics: z.optional(z.array(z.string())),
  guildId: z.optional(z.string()),
  createdAt: z.string(),
  type: z.enum(ObjectTypes),
  questsSolved: z.optional(z.number()),
  rewarded: z.optional(z.number()),
  links: z.optional(z.object({ twitter: z.string(), discord: z.string() })),
  activeSlots: z.optional(z.instanceof(Uint8Array)),
  inventory: z.instanceof(Uint8Array),
});
export type User = z.infer<typeof UserZod>;
export const UserDynamoZod = UserZod.extend({
  PK: z.string(),
  SK: z.string(),
});
export type UserDynamo = z.infer<typeof UserDynamoZod>;
export const UserComponentZod = UserZod.pick({
  id: true,
  profile: true,
  verified: true,
  username: true,
  level: true,
});
export type UserComponent = z.infer<typeof UserComponentZod>;
export const CreateUserZod = UserZod.pick({
  username: true,
});

export type CreateUser = z.infer<typeof CreateUserZod>;

const QuestPartialZod = z
  .object({
    id: z.string(),
    title: z.string(),
    topic: z.enum(Topics),
    subtopic: z.array(z.string()),
    content: z.instanceof(Uint8Array),
    reward: z.number(),
    slots: z.number(),
    creatorId: z.string(),
    createdAt: z.string(),
    published: z.boolean(),
    publishedAt: z.string(),
    inTrash: z.boolean(),
    deadline: z.string(),
    lastUpdated: z.string(),

    text: z.optional(z.instanceof(Uint8Array)),

    allowUnpublish: z.optional(z.boolean()),

    type: z.enum(ObjectTypes),
  })
  .partial();

const QuestRequiredZod = QuestPartialZod.required();
export const QuestZod = QuestPartialZod.required({
  id: true,
  published: true,
  createdAt: true,
  creatorId: true,
  inTrash: true,
  lastUpdated: true,

  type: true,
});
export type Quest = z.infer<typeof QuestZod>;

export const PublishedQuestZod = QuestRequiredZod.extend({
  creatorProfile: z.optional(z.string()),
  creatorUsername: z.string(),
  winnerId: z.optional(z.string()),
  status: z.enum(QuestStatus),
  solverCount: z.number(),
  content: z.optional(z.instanceof(Uint8Array)),
  text: z.string(),
  _event_time: z.optional(z.string()),
}).omit({
  inTrash: true,
  createdAt: true,
  allowUnpublish: true,
});
export type PublishedQuest = z.infer<typeof PublishedQuestZod>;

export const QuestDynamoZod = QuestZod.extend({
  PK: z.string(),
  SK: z.string(),
});
export type QuestDynamo = z.infer<typeof QuestDynamoZod>;
export interface PublishedQuestDynamo extends PublishedQuest {
  PK: string;
  SK: string;
}

export type QuestListComponent = Pick<
  Quest,
  "id" | "title" | "topic" | "inTrash" | "lastUpdated" | "type"
>;
export type Versions = {
  server: string;
  local: string;
};
export const SolverZod = z.object({
  id: z.string(),
  level: z.number(),
  experience: z.number(),
  profile: z.string(),
  username: z.string(),
  solutionId: z.optional(z.string()),
  status: z.optional(z.enum(SolutionStatus)),
});
export type Solver = z.infer<typeof SolverZod>;
export interface SolverDynamo extends Solver {
  PK: string;
  SK: string;
}
export const SolverPartialZod = SolverZod.pick({
  id: true,
  solutionId: true,
  status: true,
});
export type SolverPartial = z.infer<typeof SolverPartialZod>;
export const UpdateTransactionZod = z.object({
  id: z.string(),
  attribute: z.enum(QuestAttributes),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export type UpdateTransaction = z.infer<typeof UpdateTransactionZod>;

export const TransactionQueueZod = z.map(
  z.string(),
  z.object({
    transactions: z.array(UpdateTransactionZod),
  })
);
export type TransactionQueue = z.infer<typeof TransactionQueueZod>;
export const PublishedQuestsInputZod = z.object({
  topic: z.optional(z.array(z.string())),
  subtopic: z.optional(z.array(z.string())),
  filter: z.optional(z.enum(["more views", "higher reward", "latest"])),
  cursor: z.optional(z.string()),
  limit: z.optional(z.number()),
});
export type PublishedQuestsInput = z.infer<typeof PublishedQuestsInputZod>;
export const UpdateUserAttributesZod = UserZod.pick({
  profile: true,
  about: true,
  username: true,
  email: true,
  topics: true,
  subtopics: true,
  links: true,
  activeSlots: true,
  inventory: true,
}).partial();
export type UpdateUserAttributes = z.infer<typeof UpdateUserAttributesZod>;

const SolutionPartialZod = z
  .object({
    id: z.string(),
    content: z.instanceof(Uint8Array),
    creatorId: z.string(),
    topic: z.enum(Topics),
    contributors: z.set(z.string()),
    inTrash: z.boolean(),
    createdAt: z.string(),
    published: z.boolean(),
    publishedAt: z.string(),
    questId: z.string(),
    title: z.string(),
    lastUpdated: z.string(),
    viewed: z.boolean(),

    text: z.optional(z.instanceof(Uint8Array)),

    questCreatorId: z.string(),

    type: z.enum(ObjectTypes),
  })
  .partial();
export const SolutionZod = SolutionPartialZod.required({
  id: true,
  creatorId: true,
  published: true,
  inTrash: true,
  lastUpdated: true,
  createdAt: true,
  type: true,
});
export type Solution = z.infer<typeof SolutionZod>;
export const PublishedSolutionZod = SolutionPartialZod.omit({
  inTrash: true,
  createdAt: true,
})
  .required()
  .extend({
    status: z.optional(z.enum(SolutionStatus)),
    content: z.optional(z.instanceof(Uint8Array)),
    viewed: z.optional(z.boolean()),
    text: z.string(),
  })
  .partial({ contributors: true, topic: true });
export type PublishedSolution = z.infer<typeof PublishedSolutionZod>;
export const SolutionDynamoZod = SolutionZod.extend({
  PK: z.string(),
  SK: z.string(),
});
export type SolutionDynamo = z.infer<typeof SolutionDynamoZod>;
export type SolutionListComponent = Pick<
  Solution,
  "id" | "title" | "topic" | "lastUpdated" | "inTrash" | "type"
>;
export type Content = {
  content: Uint8Array;
  text: Uint8Array;
};
export type WorkspaceList = {
  quests: QuestListComponent[];
  solutions: SolutionListComponent[];
};
export const CommentZod = z.object({
  questId: z.string(),
  id: z.string(),
  creatorId: z.string(),
  createdAt: z.string(),
  text: z.string(),
  upvote: z.number(),

  type: z.enum(ObjectTypes),
});
export type Comment = z.infer<typeof CommentZod>;
export interface CommentDynamo extends Comment {
  PK: string;
  SK: string;
}
export const AddCommentZod = z.object({
  questId: z.string(),
  commentId: z.string(),
  text: z.string(),
});
export type Message = {
  id: string;
  message: string;
  user_id: string;
  created_at: Date;
  profile_url: string;
  username: string;
  level: number;
  channel: TopicsType | "GENERAL";
};

export const Post = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.enum(Topics),
  publishedAt: z.string(),
  content: z.optional(z.instanceof(Uint8Array)),
  text: z.string(),
  type: z.enum(ObjectTypes),
});
export type Post = z.infer<typeof Post>;

export type LeaderboardType = Pick<
  User,
  "username" | "level" | "profile" | "questsSolved" | "rewarded" | "profile"
> & {
  position: number;

  filter: "quests" | "reward";
};

type Slot = string | StaticImageData | null;
export interface ActiveSlots {
  hat: Slot;
  glasses: Slot;
  hair: Slot;
  upper: Slot;
  eyes: Slot;
  lower: Slot;
  skin: Slot;
}
export interface InventorySlot {
  item: string | StaticImageData | null;
  index: number;
  type?: "hat" | "glasses" | "hair" | "upper" | "eyes" | "lower" | "skin";
}
