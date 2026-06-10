import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export async function runDeploy(directory) {
  try {
    const deployScriptPath = path.join(directory, 'deploy.sh');
    
    // We execute deploy.sh inside the target directory
    const command = `cd "${directory}" && bash deploy.sh`;
    
    const { stdout, stderr } = await execPromise(command);
    
    // We take the last few lines of output to not spam the chat
    const fullOutput = stdout.trim() ? stdout.trim() : stderr.trim();
    const lines = fullOutput.split('\n');
    const snippet = lines.slice(-15).join('\n'); // last 15 lines

    return {
      success: true,
      output: snippet
    };

  } catch (error) {
    // If command fails, error.stdout or error.stderr might have the reason
    const out = error.stdout ? error.stdout.trim() : '';
    const err = error.stderr ? error.stderr.trim() : '';
    const msg = out || err || error.message;
    
    const lines = msg.split('\n');
    const snippet = lines.slice(-15).join('\n');

    return {
      success: false,
      output: snippet
    };
  }
}
