const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// تخزين مؤقت في الذاكرة (بدون قاعدة بيانات)
let questions = [];
let users = [];
let questionId = 1;
let userId = 1;

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CodeQ API is running',
        database: 'In-Memory (Development Mode)'
    });
});

// Ask question endpoint
app.post('/api/ask', async(req, res) => {
    try {
        const { question, language } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const aiResponse = await getAIResponse(question, language);

        // حفظ في الذاكرة
        const newQuestion = {
            id: questionId++,
            question,
            answer: aiResponse,
            language: language || 'general',
            createdAt: new Date()
        };

        questions.unshift(newQuestion);

        res.json({
            success: true,
            answer: aiResponse,
            questionId: newQuestion.id
        });

    } catch (error) {
        console.error('Error in /api/ask:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get popular questions
app.get('/api/questions/popular', async(req, res) => {
    try {
        const popularQuestions = questions
            .slice(0, 10)
            .map(q => ({
                question: q.question,
                language: q.language,
                createdAt: q.createdAt
            }));

        res.json({ questions: popularQuestions });
    } catch (error) {
        console.error('Error fetching popular questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save question to favorites
app.post('/api/questions/save', async(req, res) => {
    try {
        const { questionId, userId } = req.body;

        const question = questions.find(q => q.id == questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        question.isSaved = true;

        res.json({ success: true, message: 'Question saved successfully' });
    } catch (error) {
        console.error('Error saving question:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User registration
app.post('/api/auth/register', async(req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newUser = {
            id: userId++,
            name,
            email,
            password, // في الإصدار النهائي، يجب تشفير كلمة المرور
            createdAt: new Date()
        };

        users.push(newUser);

        res.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Error in user registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
app.post('/api/auth/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // في الإصدار النهائي، يجب التحقق من كلمة المرور المشفرة
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error in user login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// AI Integration (Mock)
async function getAIResponse(question, language) {
    // إجابات تجريبية ذكية
    const demoAnswers = {
        'كيف أنشئ دالة في JavaScript؟': `# إنشاء الدوال في JavaScript

## 1. Function Declaration
\`\`\`javascript
function greet(name) {
    return 'Hello, ' + name + '!';
}
console.log(greet('Ahmed')); // Hello, Ahmed!
\`\`\`

## 2. Arrow Function (ES6)
\`\`\`javascript
const greet = (name) => {
    return 'Hello, ' + name + '!';
};

// مختصر
const greetShort = name => 'Hello, ' + name + '!';
\`\`\`

## 3. Function Expression
\`\`\`javascript
const greet = function(name) {
    return 'Hello, ' + name + '!';
};
\`\`\``,

        'ما الفرق بين let و var في JavaScript؟': `# الفرق بين let و var

## 1. النطاق (Scope)
- **var**: function-scoped
- **let**: block-scoped

## أمثلة:
\`\`\`javascript
// var - متاح خارج الـ block
function testVar() {
    if (true) {
        var x = 10;
    }
    console.log(x); // 10
}

// let - غير متاح خارج الـ block  
function testLet() {
    if (true) {
        let y = 10;
    }
    console.log(y); // ReferenceError
}
\`\`\`

## نصائح:
- استخدم **let** دائمًا
- تجنب **var** في الكود الجديد`,

        'كيف أتعامل مع الـ APIs في Python؟': `# التعامل مع APIs في Python

## استخدام مكتبة requests
\`\`\`python
import requests

# GET request
response = requests.get('https://api.example.com/data')
data = response.json()

# POST request
data = {'name': 'Ahmed', 'email': 'ahmed@example.com'}
response = requests.post('https://api.example.com/users', json=data)

# مع headers
headers = {'Authorization': 'Bearer token'}
response = requests.get('https://api.example.com/protected', headers=headers)
\`\`\`

## معالجة الأخطاء
\`\`\`python
try:
    response = requests.get('https://api.example.com/data', timeout=5)
    response.raise_for_status()
    data = response.json()
except requests.exceptions.RequestException as e:
    print('Error:', e)
\`\`\``
    };

    // البحث عن إجابة محددة أو إرجاع إجابة عامة
    const specificAnswer = demoAnswers[question];
    if (specificAnswer) {
        return specificAnswer;
    }

    // إجابة عامة
    return `# إجابة على: "${question}"

## الحل المقترح:

بناءً على سؤالك حول **${language || 'البرمجة'}**، إليك الإجابة:

\`\`\`${language || 'javascript'}
// مثال عملي
function solution() {
    // الكود سيكون هنا في الإصدار الكامل
    return "إجابة مخصصة من الذكاء الاصطناعي";
}
\`\`\`

## الخطوات:
1. فهم المتطلبات
2. تصميم الحل
3. تنفيذ الكود
4. الاختبار

*ملاحظة: هذه إجابة تجريبية. في الإصدار الكامل، ستكون الإجابات أكثر دقة من الذكاء الاصطناعي الحقيقي.*`;
}

// Start server
app.listen(PORT, () => {
    console.log(`✅ CodeQ server is running on port ${PORT}`);
    console.log(`🔗 API Health check: http://localhost:${PORT}/api/health`);
    console.log(`💾 Database: In-Memory (Development Mode)`);
    console.log(`🚀 Ready to accept questions!`);
});

module.exports = app;