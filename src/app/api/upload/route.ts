"use server";

import fs from "node:fs/promises";
import path from "node:path";

export async function uploadFile(formData: FormData) {
  const file = formData.get("resume") as File;

  if (!file) {
    return { success: false, message: "No file uploaded." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Define the target directory within 'public'
  const uploadDir = path.join(process.cwd(), "public", "uploads"); 
  
  // Ensure the directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Define the file path within the 'uploads' directory
  const filePath = path.join(uploadDir, file.name);

  try {
    await fs.writeFile(filePath, buffer);
    return { success: true, message: `File saved to ${filePath}` };
  } catch (error) {
    console.error("Error saving file:", error);
    return { success: false, message: "Failed to save file." };
  }
}