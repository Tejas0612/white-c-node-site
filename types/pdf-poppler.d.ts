declare module "pdf-poppler" {
  type ConvertOptions = {
    format?: "jpeg" | "png"
    out_dir?: string
    out_prefix?: string
    page?: number
    single_file?: boolean
    scale?: number
  }

  export function convert(
    filePath: string,
    options: ConvertOptions
  ): Promise<void>
}