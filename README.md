This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Navbar Tag Hiding

The div with className `"flex items-center gap-1.5 shrink-0"` in [src/components/CanvasWorkspace.tsx:408](src/components/CanvasWorkspace.tsx) is commented to hide a tag in the navbar. To restore visibility, uncomment this line.