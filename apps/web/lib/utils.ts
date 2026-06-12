import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Network response was not ok')
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error downloading file:', error)
    // Fallback for CORS issues or other fetch errors
    const fallbackUrl = new URL(url)
    fallbackUrl.searchParams.set('download', filename)
    const link = document.createElement('a')
    link.href = fallbackUrl.toString()
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
