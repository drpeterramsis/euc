import express from 'express';
import { Octokit } from 'octokit';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Octokit
  const octokit = new Octokit({ auth: process.env.EUC_TOken });

  // GitHub API helpers
  const getFileFromGitHub = async () => {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: process.env.EUC_USER!,
        repo: process.env.EUC_REPO!,
        path: 'users.json',
        ref: process.env.EUC_BRANCH!,
      });
      if ('content' in data && !Array.isArray(data)) {
        return {
          content: Buffer.from(data.content, 'base64').toString(),
          sha: data.sha,
        };
      }
      return { content: '[]', sha: null };
    } catch {
      return { content: '[]', sha: null };
    }
  };

  // API Routes
  app.get('/api/users', async (req, res) => {
    const { content } = await getFileFromGitHub();
    res.json(JSON.parse(content));
  });

  app.post('/api/users', async (req, res) => {
    const updatedUsers = req.body;
    const { sha } = await getFileFromGitHub();

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.EUC_USER!,
      repo: process.env.EUC_REPO!,
      path: 'users.json',
      message: 'Update users.json (via EVA URO CLUB App)',
      content: Buffer.from(JSON.stringify(updatedUsers, null, 2)).toString('base64'),
      sha: sha || undefined,
      branch: process.env.EUC_BRANCH!,
    });

    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production handling
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
