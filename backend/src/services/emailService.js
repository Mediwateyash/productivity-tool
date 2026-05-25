const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const localDB = require('../config/localDB');

// Email Log directory configuration for auditing & offline viewing
const LOGS_DIR = path.join(__dirname, '..', '..', 'data', 'local_db');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Mailer Transporter central initialization
let transporter = null;
try {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    console.log('📬 SMTP Mailer Service initialized successfully.');
  } else {
    console.warn('⚠️ EMAIL_USER/EMAIL_PASS not found. Mailer running in Local Mock Logging Mode.');
  }
} catch (err) {
  console.error('❌ Failed to initialize Nodemailer transporter:', err);
}

/**
 * Log email delivery attempt into database/file log
 */
const logEmailAttempt = async (userId, recipient, subject, templateType, status, error = null) => {
  const logData = {
    userId,
    recipient,
    subject,
    templateType,
    status,
    timestamp: new Date().toISOString(),
    error: error ? error.message || String(error) : null
  };
  
  try {
    if (process.env.USE_LOCAL_JSON === 'true' || !transporter) {
      await localDB.create('email_logs', logData);
    } else {
      // Direct logging helper using local fallback or console
      const logsPath = path.join(LOGS_DIR, 'email_logs.json');
      let logs = [];
      if (fs.existsSync(logsPath)) {
        try {
          logs = JSON.parse(fs.readFileSync(logsPath, 'utf8') || '[]');
        } catch (e) {
          logs = [];
        }
      }
      logs.push({ _id: Math.random().toString(36).substr(2, 9), ...logData });
      fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Failed to log email attempt:', err);
  }
};

/**
 * Spam Prevention: Check Cooldowns and Send Limits
 * Returns true if allowed, false if blocked by anti-spam policies
 */
const checkAntiSpamPolicies = async (userId, templateType) => {
  try {
    const logs = process.env.USE_LOCAL_JSON === 'true' || !transporter
      ? await localDB.find('email_logs', { userId })
      : (() => {
          const logsPath = path.join(LOGS_DIR, 'email_logs.json');
          if (!fs.existsSync(logsPath)) return [];
          try {
            const data = JSON.parse(fs.readFileSync(logsPath, 'utf8') || '[]');
            return data.filter(l => l.userId === userId);
          } catch (e) {
            return [];
          }
        })();

    if (logs.length === 0) return true;

    const now = new Date();

    // 1. Cooldown Safeguard (e.g., minimum 2 minutes between task reminders of same type)
    if (templateType === 'task-reminder') {
      const sameTypeLogs = logs.filter(l => l.templateType === templateType && l.status === 'success');
      if (sameTypeLogs.length > 0) {
        const lastLog = sameTypeLogs[sameTypeLogs.length - 1];
        const secondsSinceLast = (now - new Date(lastLog.timestamp)) / 1000;
        if (secondsSinceLast < 120) { // 2 minute spam guard cooldown
          console.warn(`🛑 Anti-spam: Task reminder blocked for User ${userId} (cooldown: ${Math.round(120 - secondsSinceLast)}s remaining)`);
          return false;
        }
      }
    }

    // 2. Daily Send Limit Safeguard (e.g., max 25 emails per user per day to prevent SMTP threshold burnouts)
    const todayLogs = logs.filter(l => {
      const logDateStr = new Date(l.timestamp).toISOString().split('T')[0];
      const todayDateStr = now.toISOString().split('T')[0];
      return logDateStr === todayDateStr && l.status === 'success';
    });

    if (todayLogs.length >= 25) {
      console.warn(`🛑 Anti-spam: User ${userId} has hit the daily sending limit threshold (25 emails/day)`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error checking anti-spam rules:', err);
    return true; // Fallback to allowing in case of error
  }
};

/**
 * Premium Minimal Dark Theme HTML Layout Shell
 */
const getHtmlLayout = (contentHtml, previewText) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Productivity</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #030712;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f3f4f6;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #030712;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.15);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }
    .header {
      padding: 32px;
      text-align: center;
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      border-bottom: 1px solid rgba(59, 130, 246, 0.1);
    }
    .logo-container {
      display: inline-block;
      margin-bottom: 8px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 11px;
      color: #60a5fa;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .body {
      padding: 32px 24px;
    }
    .card {
      background-color: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      padding: 12px 28px;
      background-color: #2563eb;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-decoration: none;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
      text-align: center;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    .badge-high { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .badge-medium { background-color: rgba(249, 115, 22, 0.15); color: #f97316; }
    .badge-low { background-color: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .quote-box {
      border-left: 3px solid #3b82f6;
      padding-left: 14px;
      margin: 20px 0;
      font-style: italic;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <span style="display:none !important; font-size:1px; color:#030712; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${previewText}</span>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <span class="logo-text">Productivity</span>
        </div>
        <div class="subtitle">Plan Better. Execute Smarter. Grow Daily.</div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p>This email was sent by your virtual AI Productivity Coach.</p>
        <p>Manage your notifications anytime in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings">Settings Dashboard</a>.</p>
        <p style="margin-top: 16px; font-size: 9px; color: #475569;">© 2026 Productivity. Premium Glassmorphic Systems.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Scalable Abstract Core Dispatcher
 * Incorporates failure retry logic and providers
 */
const sendEmail = async ({ userId, to, subject, htmlContent, previewText, templateType, retries = 2 }) => {
  // Check anti-spam regulations
  const isAllowed = await checkAntiSpamPolicies(userId, templateType);
  if (!isAllowed) {
    return { success: false, reason: 'anti-spam-cooldown' };
  }

  const finalHtml = getHtmlLayout(htmlContent, previewText);
  
  if (!transporter) {
    // Offline / Mock fallback logging system
    console.log(`[Offline Mailer Fallback] Mocking dispatch to: ${to} | Subject: ${subject}`);
    await logEmailAttempt(userId, to, subject, templateType, 'success');
    return { success: true, offlineMock: true };
  }

  const mailOptions = {
    from: `"Productivity Coach" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: finalHtml
  };

  // Execution with automated retries
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📬 Email successfully delivered to ${to} (Attempt ${attempt + 1}). MessageId: ${info.messageId}`);
      await logEmailAttempt(userId, to, subject, templateType, 'success');
      return { success: true, messageId: info.messageId };
    } catch (err) {
      attempt++;
      console.error(`❌ Email delivery attempt ${attempt} failed for ${to}:`, err);
      if (attempt > retries) {
        await logEmailAttempt(userId, to, subject, templateType, 'failed', err);
        return { success: false, error: err };
      }
      // Simple linear backoff pause before retrying
      await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
};

const emailService = {
  /**
   * Validate SMTP Credentials Safely
   */
  validateConnection: async () => {
    if (!transporter) return { success: false, reason: 'No SMTP credentials supplied in environment.' };
    try {
      await transporter.verify();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || err };
    }
  },

  /**
   * 1. Send Test Configuration Email
   */
  sendTestSettingsEmail: async (user) => {
    const htmlContent = `
      <h2 style="margin-top:0; color:#ffffff; font-size:22px; font-weight:800;">🔒 SMTP Setup Fully Configured!</h2>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Hello, <strong>${user.name}</strong>!</p>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
        Congratulations! Your **Productivity** email notifications are now securely integrated with Nodemailer & Gmail SMTP credentials.
      </p>
      <div class="card" style="text-align: center; border: 1px dashed rgba(59,130,246,0.3); background-color: rgba(59,130,246,0.05);">
        <p style="color:#60a5fa; font-size:12px; font-weight:700; margin:0; text-transform:uppercase; letter-spacing:0.05em;">Preferences Status</p>
        <p style="color:#ffffff; font-size:16px; font-weight:800; margin:8px 0 0 0;">✨ ONLINE & READY TO DEPLOY</p>
      </div>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
        You will now receive automated task deadline reminders, daily summaries, and weekly metrics reports according to your settings.
      </p>
      <div style="text-align:center; margin:32px 0 16px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Launch Control Center</a>
      </div>
    `;
    
    return sendEmail({
      userId: user.id || user._id,
      to: user.email,
      subject: '✨ Setup Confirmed: Productivity Notifications Active',
      htmlContent,
      previewText: 'Your email credentials are functional and notifications are fully enabled!',
      templateType: 'test-email'
    });
  },

  /**
   * 2. Send Task Deadline Alerts
   */
  sendTaskDeadlineReminder: async (user, task) => {
    // Dynamic countdown formatting
    const now = new Date();
    const diffMs = new Date(task.dueDate) - now;
    const diffMins = Math.max(0, Math.round(diffMs / 1000 / 60));
    const countdownStr = diffMins > 60 
      ? `Due in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
      : `Due in ${diffMins} minutes!`;

    const priorityClass = task.priority === 'high' ? 'badge-high' : task.priority === 'medium' ? 'badge-medium' : 'badge-low';

    const quotes = [
      { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
      { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
      { text: "Your mind is for having ideas, not holding them.", author: "David Allen" }
    ];
    const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const htmlContent = `
      <h2 style="margin-top:0; color:#ef4444; font-size:22px; font-weight:800;">⏱️ Task Deadline Approaching</h2>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Hello, ${user.name}!</p>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
        This is a quick check-in from your AI Coach. One of your core targets is due shortly. Make sure to lock down distractions and complete this milestone.
      </p>
      
      <div class="card">
        <div style="float: right;">
          <span class="badge ${priorityClass}">${task.priority} Priority</span>
        </div>
        <h3 style="color:#ffffff; font-size:18px; margin:0 0 10px 0; font-weight:800;">${task.title}</h3>
        <p style="color:#ef4444; font-weight:800; font-size:14px; margin:0;">🚨 ${countdownStr}</p>
        ${task.notes ? `<p style="color:#94a3b8; font-size:12px; margin:8px 0 0 0; line-height:1.4;">Note: ${task.notes}</p>` : ''}
      </div>

      <div class="quote-box">
        “${selectedQuote.text}”
        <br>
        <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block; margin-top:6px;">— ${selectedQuote.author}</span>
      </div>

      <div style="text-align:center; margin:32px 0 16px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Open Dashboard</a>
      </div>
    `;

    return sendEmail({
      userId: user.id || user._id,
      to: user.email,
      subject: `⏱️ Reminder: "${task.title}" is due soon!`,
      htmlContent,
      previewText: `${task.title} is due in ${countdownStr}. Let's tick it off!`,
      templateType: 'task-reminder'
    });
  },

  /**
   * 3. Send Daily Productivity Summary Digest
   */
  sendDailyProductivityDigest: async (user, stats) => {
    const { completedCount, pendingCount, score, streak, pomodoros, tomorrowFocus } = stats;
    
    // Calculate simple ratios for custom text analytics
    const ratio = completedCount + pendingCount > 0 
      ? Math.round((completedCount / (completedCount + pendingCount)) * 100) 
      : 0;

    const htmlContent = `
      <h2 style="margin-top:0; color:#3b82f6; font-size:22px; font-weight:800;">📅 Your Daily Productivity Digest</h2>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Hi, ${user.name}!</p>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
        Here is your core metric summary for today, ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Consistent daily execution turns routines into achievements.
      </p>

      <div class="card" style="padding: 10px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="padding:10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block;">Daily Focus Score</span>
              <span style="font-size:24px; font-weight:800; color:#3b82f6; display:block; margin-top:4px;">${score}%</span>
            </td>
            <td width="50%" style="padding:10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block;">Ticked Tasks</span>
              <span style="font-size:24px; font-weight:800; color:#10b981; display:block; margin-top:4px;">${completedCount} <span style="font-size:12px; font-weight:500; color:#64748b;">completed</span></span>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:10px 0;">
              <span style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block;">Pomo Sessions</span>
              <span style="font-size:24px; font-weight:800; color:#f97316; display:block; margin-top:4px;">⏱️ ${pomodoros} blocks</span>
            </td>
            <td width="50%" style="padding:10px 0;">
              <span style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:block;">Daily Streak</span>
              <span style="font-size:24px; font-weight:800; color:#f59e0b; display:block; margin-top:4px;">🔥 ${streak} Days</span>
            </td>
          </tr>
        </table>
      </div>

      ${tomorrowFocus ? `
      <div class="card" style="border-left: 4px solid #6366f1; background-color: rgba(99,102,241,0.05);">
        <h4 style="margin:0 0 6px 0; color:#818cf8; text-transform:uppercase; font-size:11px; letter-spacing:0.05em;">Tomorrow's Declared Main Focus</h4>
        <p style="margin:0; font-size:14px; font-weight:800; color:#ffffff;">${tomorrowFocus}</p>
      </div>
      ` : ''}

      <p style="color:#cbd5e1; font-size:13px; line-height:1.6; text-align:center;">
        ${ratio >= 80 ? '🎯 Exceptional delivery! You crushed today\'s targets.' : ratio >= 50 ? '⚡ Good, consistent effort. Let\'s push for even higher completion rates tomorrow!' : '🌱 Tomorrow is a fresh canvas. Declare a small focus block and start early.'}
      </p>

      <div style="text-align:center; margin:32px 0 16px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Log Tomorrow's Focus</a>
      </div>
    `;

    return sendEmail({
      userId: user.id || user._id,
      to: user.email,
      subject: `📅 Daily Focus Digest: ${score}% Score — 🔥 Streak: ${streak} Days`,
      htmlContent,
      previewText: `Today: ${completedCount} completed, ${pendingCount} pending tasks. Daily streak is 🔥 ${streak} days.`,
      templateType: 'daily-digest'
    });
  },

  /**
   * 4. Send Weekly Productivity Analytics Report
   */
  sendWeeklyProductivityReport: async (user, reports) => {
    const { weeklyRatio, consistencyScore, productiveHours, achievementsCount, aiFeedback } = reports;
    
    const htmlContent = `
      <h2 style="margin-top:0; color:#8b5cf6; font-size:22px; font-weight:800;">🏆 Your Weekly Analytics & Milestone Report</h2>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Hello, ${user.name}!</p>
      <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
        Your productivity metrics have compiled for the past 7 days. Review your consistency, track trends, and absorb coaching diagnostics.
      </p>

      <div class="card" style="padding:10px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:15px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-size:11px; color:#a78bfa; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Global Task Completion Rate</span>
              <span style="font-size:38px; font-weight:800; color:#8b5cf6; display:block; margin-top:4px;">${weeklyRatio}%</span>
            </td>
          </tr>
          <tr>
            <td style="padding:15px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" align="center">
                    <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Consistency</span>
                    <span style="font-size:18px; font-weight:800; color:#ffffff; display:block; margin-top:4px;">${consistencyScore}%</span>
                  </td>
                  <td width="33%" align="center">
                    <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Focus Hours</span>
                    <span style="font-size:18px; font-weight:800; color:#ffffff; display:block; margin-top:4px;">${productiveHours}h</span>
                  </td>
                  <td width="34%" align="center">
                    <span style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Milestones</span>
                    <span style="font-size:18px; font-weight:800; color:#ffffff; display:block; margin-top:4px;">🏆 ${achievementsCount}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <div class="card" style="border-left: 4px solid #8b5cf6; background-color: rgba(139,92,246,0.05);">
        <h4 style="margin:0 0 8px 0; color:#a78bfa; text-transform:uppercase; font-size:11px; letter-spacing:0.05em; font-weight:800;">🧠 AI Productivity Mentorship</h4>
        <p style="margin:0; font-size:13px; color:#e2e8f0; line-height:1.6; font-style:normal;">
          ${aiFeedback}
        </p>
      </div>

      <div style="text-align:center; margin:32px 0 16px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/achievements" class="button" style="background-color:#8b5cf6; box-shadow:0 4px 6px -1px rgba(139,92,246,0.2);">Check Milestones Board</a>
      </div>
    `;

    return sendEmail({
      userId: user.id || user._id,
      to: user.email,
      subject: `🏆 Weekly Analytics: ${weeklyRatio}% Completion — AI Coaching Active`,
      htmlContent,
      previewText: `Weekly summary: ${weeklyRatio}% completion, ${productiveHours} focus hours, and ${achievementsCount} milestones unlocked.`,
      templateType: 'weekly-report'
    });
  }
};

module.exports = emailService;
