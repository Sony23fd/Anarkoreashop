import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB limit
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), "public", "uploads", "settings")
    await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.split(".").pop() ?? "png"
    const filename = `logo-${Date.now()}.${ext}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/settings/${filename}`

    return NextResponse.json({ success: true, url: fileUrl })
  } catch (e) {
    console.error("Settings upload error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
