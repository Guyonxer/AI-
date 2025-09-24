import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const TO_EMAILS = ['1195789898@qq.com', 'huaxi.Wu@dayepower.com'];
const NEWS_ARCHIVE_PATH = path.join(__dirname, 'news_archive.json');

// This would be dynamically fetched in a real run, but for this script, we use the last fetched data.
const all_latest_articles_from_hn = [
    { id: 45359412, title: "America's Next Top Model Context Protocol Server [video]", link: "https://www.youtube.com/watch?v=mVrCPo8eB3A" },
    { id: 45359385, title: "Chrome DevTools (MCP) for your AI agent", link: "https://developer.chrome.com/blog/chrome-devtools-mcp" },
    { id: 45359361, title: "AI and the FDA", link: "https://marginalrevolution.com/marginalrevolution/2025/09/ai-and-the-fda.html" },
    { id: 45359339, title: "Show HN: Verdent – AI coding agent that plans, tests, and ships", link: "https://www.verdent.ai/" },
    { id: 45359334, title: "How to factor cost into agentic tool design", link: "https://www.speakeasy.com/blog/cost-aware-pass-rate" },
    { id: 45359271, title: "Show HN: Tool to measure AI adoption in software development teams", link: "https://www.aidevscore.com/" },
    { id: 45359189, title: "A.I. Bots or Us: Who Will End Humanity First?", link: "https://www.nytimes.com/2025/08/27/books/review/if-anyone-builds-it-everyone-dies-eliezer-yudowsky-nate-soares-ai-con-emily-bender-alex-hanna.html" },
    { id: 45359146, title: "Keystone Titles: Organize 100–500 Variants and Prevent LLM Looping", link: "https://lightcapai.medium.com/keystone-titles-as-gravity-wells-clustering-hundreds-of-variants-loop-proofing-ai-writing-71f2ca158acb" },
    { id: 45359130, title: "2025 Dora State of AI-Assisted Software Development", link: "https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report/" },
    { id: 45359073, title: "Qwen3-Max: 1T parameter model", link: "https://qwen.ai/blog?id=87dc93fc8a590dc718c77e1f6e84c07b474f6c5a&from=home.latest-research-list" },
    { id: 45329744, title: "Mindstorms in Natural Language-Based Societies of Mind", link: "https://arxiv.org/abs/2305.17066" },
    { id: 45329704, title: "AI Psychosis and the Warped Mirror", link: "https://pluralistic.net/2025/09/17/automating-gang-stalking-delusion/#paranoid-androids" },
    { id: 45329576, title: "The Missing Rungs: What Nobody Will Tell You About AI and Your Job", link: "https://boxofamazing.substack.com/p/the-missing-rungs-what-nobody-will" },
    { id: 45329495, title: "Show HN: Ida Swarm – Multi-agent AI system for automated reverse engineering", link: "https://github.com/shells-above/ida-swarm" },
    { id: 45329322, title: "Everyone's trying vectors and graphs for AI memory. We went back to SQL", link: "N/A" },
    { id: 45329274, title: "Show HN: RealTimeX – Local\u2010first private AI agents", link: "https://realtimex.ai" },
    { id: 45329240, title: "Ask HN: Has Claude Code suddenly started name-dropping Anthropic in commit msgs?", link: "N/A" },
    { id: 45329238, title: "How People Use ChatGPT[pdf]", link: "https://www.nber.org/system/files/working_papers/w34255/w34255.pdf" },
    { id: 45329125, title: "AI as Religion – A Short Thought Experiment", link: "https://www.mandar.cloud/blog.html?slug=ai-as-religion-a-short-thought-experiment" },
    { id: 45329040, title: "Model Context Protocol: A Deep Dive into the Future of AI Systems", link: "https://youtu.be/uBL0siiliGo?si=YPmuttKoZyX0tbqY" }
];

// This is the AI semantic classification function we discussed.
// For this script, we are simulating its output with a pre-filtered list.
const getAiRelatedArticles = (articles) => {
    return articles; // In a real scenario, this would involve complex logic.
}

async function main() {
    // 1. Load the archive of already sent articles
    let newsArchive = [];
    if (fs.existsSync(NEWS_ARCHIVE_PATH)) {
        newsArchive = JSON.parse(fs.readFileSync(NEWS_ARCHIVE_PATH));
    }
    const sentArticleIds = new Set(newsArchive.map(a => a.id));
    console.log(`Loaded ${sentArticleIds.size} articles from the archive.`);

    // 2. Filter out already sent articles
    const newArticlesFromHN = all_latest_articles_from_hn.filter(article => !sentArticleIds.has(article.id));
    console.log(`Found ${newArticlesFromHN.length} new articles from Hacker News.`);

    // 3. Perform AI semantic classification on the new articles
    const newAiArticles = getAiRelatedArticles(newArticlesFromHN);
    console.log(`After AI semantic filtering, ${newAiArticles.length} new AI-related articles were found.`);

    if (newAiArticles.length === 0) {
        console.log('No new AI articles to send today. Exiting.');
        return;
    }

    // 4. Update the news archive with the new articles
    const updatedArchive = [...newAiArticles, ...newsArchive];
    fs.writeFileSync(NEWS_ARCHIVE_PATH, JSON.stringify(updatedArchive, null, 2));
    console.log(`News archive updated. Total articles in archive: ${updatedArchive.length}`);

    // 5. Send the email with only the new articles
    console.log('Preparing to send email with new articles...');
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    const { client_secret, client_id } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
    oAuth2Client.setCredentials(token);

    console.log('Refreshing token...');
    try {
        const { credentials: newTokens } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(newTokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens));
        console.log('Token refreshed successfully.');
    } catch (err) {
        console.error('Error refreshing access token.', err.response ? err.response.data : err.message);
        return; 
    }

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    let emailBody = `<h1>AI Daily Report - New Articles</h1><p>Found ${newAiArticles.length} new articles for you today.</p><ul>`;
    newAiArticles.forEach(article => {
        if (article.link && article.link !== "N/A") {
            emailBody += `<li><h3><a href="${article.link}">${article.title}</a></h3></li>`;
        } else {
            emailBody += `<li><h3>${article.title} (No link provided)</h3></li>`;
        }
    });
    emailBody += '</ul>';

    const email = [
        `Content-Type: text/html; charset="UTF-8"`,
        `To: ${TO_EMAILS.join(', ')}`,
        `From: me`,
        `Subject: New AI Articles - ${new Date().toLocaleDateString()}`,
        '',
        emailBody
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedEmail
            }
        });
        console.log(`Email with new articles sent successfully to ${TO_EMAILS.join(', ')}`);
    } catch (error) {
        console.error('Failed to send email:', error.response ? error.response.data : error.message);
    }
}

main().catch(console.error);