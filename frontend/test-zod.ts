import { z } from "zod";

const schema = z.object({
  maxHeartRate: z.number().min(60).max(220).nullish()
});

console.log(schema.safeParse({ maxHeartRate: null }));
console.log(schema.safeParse({ maxHeartRate: 0 }));
