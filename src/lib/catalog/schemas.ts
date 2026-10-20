import { z } from "zod";
import { GARMENT_KINDS, PRODUCT_STATUSES } from "./types";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const slug = z.string().trim().regex(SLUG, "Use só letras minúsculas, números e hífens.");
const kicker = z.string().trim().max(60);
const description = z.string().trim().max(300);

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  detail: z.string().trim().max(60),
  description: z.string().trim().max(2000),
  categoryId: z.uuid(),
  priceCents: z.number().int().positive(),
  weightGrams: z.number().int().positive(),
  isNew: z.boolean(),
  garment: z.enum(GARMENT_KINDS),
  status: z.enum(PRODUCT_STATUSES),
  collectionIds: z.array(z.uuid()),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  kicker,
  description,
  garment: z.enum(GARMENT_KINDS),
  showOnHome: z.boolean(),
});

export const collectionFormSchema = z.object({
  title: z.string().trim().min(2).max(60),
  slug,
  kicker,
  description,
  showInNav: z.boolean(),
});

export const colorFormSchema = z.object({
  label: z.string().trim().min(2).max(40),
  slug,
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB.")
    .transform((h) => h.toLowerCase()),
});
