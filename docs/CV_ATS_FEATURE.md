# CV Upload and ATS Feature

## Supported Inputs

- PDF
- DOCX
- Legacy DOC with graceful rejection message
- TXT / MD
- Pasted resume text

Maximum upload size is 10 MB.

## Upload Flow

The frontend sends authenticated `multipart/form-data` to:

```text
POST /api/cv/upload-analyze
```

The request may contain:

- `cv`: uploaded file
- `cvText`: pasted resume text

The backend uses memory storage and does not persist uploaded files.

## Extraction Flow

`server/services/cvExtraction.service.ts` handles extraction:

- PDF: `pdf-parse`
- DOCX: `mammoth`
- TXT/MD: UTF-8 text
- DOC: rejected with a clear message because legacy DOC extraction can be unreliable and may require heavier tooling

If a PDF appears scanned or image-based, the user receives a warning asking for a text-based PDF or DOCX.

## AI Analysis Flow

`server/ai/cvAnalysis.service.ts` returns structured analysis:

- detected domain and role
- confidence
- estimated ATS score and grade
- skills, tools, education, certifications, projects, achievements
- weaknesses, missing keywords, ATS issues
- section scores
- suggested interview tracks and custom interview questions
- improved ATS-friendly CV structure

If Gemini is unavailable, the app returns extracted text-based fallback analysis and clearly marks AI analysis as unavailable. It avoids confident fake ATS claims.

## Download Flow

Downloads are generated on demand from structured improved CV data:

- `POST /api/cv/download/docx`
- `POST /api/cv/download/pdf`

DOCX output uses simple headings and bullets. PDF output uses readable text, standard margins, and no graphics/tables.

## Job Description Based ATS Matching

Authenticated users can optionally paste a job description after CV analysis and request:

```text
POST /api/cv/job-match
```

The endpoint accepts `cvText` or prior `cvAnalysis`, plus `jobDescription`, and returns:

- estimated job-specific ATS match score and grade
- detected target role and seniority
- matched and missing keywords
- important required skills and optional skills
- experience, skills, keyword, and education alignment scores
- gaps with severity and recommendations
- section-specific tailored CV suggestions

When Gemini is configured, the prompt asks for strict JSON only, separates hard requirements from preferred requirements, and forbids fabricated experience. When Gemini is unavailable, the response is clearly marked as basic local keyword-overlap analysis and includes the message that AI job matching is temporarily unavailable.

Job-tailored CV generation is available at:

```text
POST /api/cv/generate-job-tailored
```

It uses the job description, match analysis, and original/improved CV context to produce an ATS-friendly CV structure. It may recommend truthful edits, but must not invent jobs, degrees, companies, years, certifications, metrics, or skills.

Download filenames are variant-aware:

- General: `ats-friendly-cv.docx`, `ats-friendly-cv.pdf`
- Job-tailored: `job-tailored-ats-cv.docx`, `job-tailored-ats-cv.pdf`

## Limitations

- ATS score is an estimate against general best practices or the pasted job description, depending on the selected flow.
- Job-description matching is not a hiring guarantee and cannot verify hidden ATS rules.
- Scanned PDFs need OCR, which is not included.
- Legacy `.doc` extraction is not implemented.
- No permanent CV storage is used yet.

## Future Improvements

- OCR for scanned PDFs.
- Malware scanning for uploaded documents.
- Supabase storage/persistence with retention controls.
- Richer editable CV sections and version history.
