import { z } from "zod";

export const reviewTestMatrixSchema = z.object({
  scenarios: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      expectedResult: z.string(),
      actualResult: z.string().optional(),
      status: z.enum(["pass", "fail", "pending"]),
    })
  ),
});

export type ReviewTestMatrix = z.infer<typeof reviewTestMatrixSchema>;

export function parseReviewTestMatrix(data: unknown): ReviewTestMatrix {
  return reviewTestMatrixSchema.parse(data);
}
