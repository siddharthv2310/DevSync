
import { z } from "zod";

export const moveTaskParamsSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
});

export const moveTaskSchema = z.object({
  targetColumnId: z.string().uuid(),
  position: z.number().int().min(0),
});

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
