import { z } from "zod";

export const addToolParamsSchema = { a: z.number(), b: z.number() };
export const substractToolParamsSchema = { a: z.number(), b: z.number() };
export const calculateBmiToolParamsSchema = { weightKg: z.number(), heightM: z.number() };
export const greetPromptParamsSchema = { name: z.string() };


