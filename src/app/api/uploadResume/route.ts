import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import PDFParser from 'pdf2json'

function cleanResumeText(rawText: string): string {
  return rawText
    .replace(/\r\n|\r|\n/g, '\n')       // Normalize line endings
    .replace(/ {2,}/g, ' ')             // Multiple spaces to single
    .replace(/–/g, '-')                 // Replace fancy dashes if needed
    .replace(/(\n){3,}/g, '\n\n')       // Limit excessive empty lines
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const uploadedFile = formData.get('resume')

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json({ error: 'Resume file is required.' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    const tempFileName = `${uuidv4()}-${uploadedFile.name.replace(/[^\w.-]/g, '') || 'resume.pdf'}`
    const tempFilePath = path.join(uploadDir, tempFileName)

    const buffer = Buffer.from(await uploadedFile.arrayBuffer())
    await fs.writeFile(tempFilePath, buffer)

    const rawText = await new Promise<string>((resolve, reject) => {
      const parser = new (PDFParser as any)(null, 1)

      parser.on('pdfParser_dataError', (err: any) => {
        reject(err?.parserError ?? err)
      })

      parser.on('pdfParser_dataReady', () => {
        try {
          const text = parser.getRawTextContent()
          resolve(typeof text === 'string' ? text : '')
        } catch (error) {
          reject(error)
        }
      })

      parser.loadPDF(tempFilePath)
    })

    await fs.unlink(tempFilePath).catch(() => {})

    const cleanedText = cleanResumeText(rawText)
    if (!cleanedText) {
      return NextResponse.json({ error: 'Unable to extract resume text.' }, { status: 422 })
    }

    return NextResponse.json({ text: cleanedText })
  } catch (error) {
    console.error('Resume parse failed:', error)
    const message = error instanceof Error ? error.message : 'Unable to parse resume.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}