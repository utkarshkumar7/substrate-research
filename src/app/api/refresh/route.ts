import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export async function POST() {
  const agentDir = path.join(process.cwd(), "agent")

  try {
    const { stdout } = await execAsync(
      "uv run python refresh.py --period 1mo",
      { cwd: agentDir, timeout: 240_000 } // 4 min max
    )

    const succeeded = stdout.match(/Succeeded\s*:\s*(\d+)/)?.[1]
    const failed    = stdout.match(/Failed\s*:\s*(\d+)/)?.[1]
    const duration  = stdout.match(/Done in\s*([\d.]+)s/)?.[1]

    return Response.json({
      success: true,
      n_succeeded: succeeded ? parseInt(succeeded) : null,
      n_failed:    failed    ? parseInt(failed)    : 0,
      duration_s:  duration  ? parseFloat(duration) : null,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ success: false, error: msg }, { status: 500 })
  }
}
