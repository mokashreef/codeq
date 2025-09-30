// تطبيق CodeQ
class CodeQApp {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        this.API_BASE = 'http://localhost:3000/api'; // تغيير هذا عند النشر

        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.checkAuthStatus();
    }

    // تهيئة عناصر DOM
    initializeElements() {
        // عناصر البحث
        this.questionInput = document.getElementById('questionInput');
        this.languageSelect = document.getElementById('languageSelect');
        this.askBtn = document.getElementById('askBtn');

        // عناصر الإجابة
        this.answerSection = document.getElementById('answerSection');
        this.answerContent = document.getElementById('answerContent');
        this.copyAnswerBtn = document.getElementById('copyAnswer');
        this.saveQuestionBtn = document.getElementById('saveQuestion');

        // النماذج المنبثقة
        this.loginModal = document.getElementById('loginModal');
        this.registerModal = document.getElementById('registerModal');
        this.loginBtn = document.getElementById('loginBtn');

        // التحكم في السمة
        this.themeToggle = document.getElementById('themeToggle');

        // الأسئلة الشائعة
        this.questionCards = document.querySelectorAll('.question-card');
    }

    // إعداد المستمعين للأحداث
    setupEventListeners() {
        const self = this;

        // طرح السؤال
        this.askBtn.addEventListener('click', function() {
            self.askQuestion();
        });

        this.questionInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                self.askQuestion();
            }
        });

        // نسخ الإجابة
        this.copyAnswerBtn.addEventListener('click', function() {
            self.copyAnswer();
        });

        // حفظ السؤال
        this.saveQuestionBtn.addEventListener('click', function() {
            self.saveQuestion();
        });

        // الأسئلة الشائعة
        this.questionCards.forEach(function(card) {
            card.addEventListener('click', function() {
                const question = this.getAttribute('data-question');
                self.questionInput.value = question;
                self.askQuestion();
            });
        });

        // التحكم في السمة
        this.themeToggle.addEventListener('click', function() {
            self.toggleTheme();
        });

        // إدارة النماذج المنبثقة
        this.setupModalEvents();
    }

    // إدارة النماذج المنبثقة
    setupModalEvents() {
        const self = this;

        // فتح نافذة تسجيل الدخول
        this.loginBtn.addEventListener('click', function() {
            self.showModal(self.loginModal);
        });

        // التبديل بين تسجيل الدخول والتسجيل
        document.getElementById('showRegister').addEventListener('click', function(e) {
            e.preventDefault();
            self.hideModal(self.loginModal);
            self.showModal(self.registerModal);
        });

        document.getElementById('showLogin').addEventListener('click', function(e) {
            e.preventDefault();
            self.hideModal(self.registerModal);
            self.showModal(self.loginModal);
        });

        // إغلاق النماذج
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.hideModals();
            });
        });

        // النقر خارج النموذج لإغلاقه
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    self.hideModals();
                }
            });
        });

        // إرسال النماذج
        document.querySelectorAll('.modal-form').forEach(function(form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self.handleFormSubmit(this);
            });
        });
    }

    // طرح سؤال
    async askQuestion() {
        const question = this.questionInput.value.trim();
        const language = this.languageSelect.value;

        if (!question) {
            this.showNotification('يرجى كتابة سؤال', 'error');
            return;
        }

        this.isLoading = true;
        this.setLoadingState(true);

        try {
            const response = await this.sendQuestionToAPI(question, language);
            this.displayAnswer(response.answer);
            this.showNotification('تم الحصول على الإجابة بنجاح', 'success');
        } catch (error) {
            console.error('Error asking question:', error);
            this.showNotification('حدث خطأ في الحصول على الإجابة', 'error');
            // عرض إجابة تجريبية للاختبار
            this.displayDemoAnswer(question, language);
        } finally {
            this.isLoading = false;
            this.setLoadingState(false);
        }
    }

    // إرسال السؤال إلى API (تجريبي - سيتم استبداله بالاتصال الحقيقي)
    async sendQuestionToAPI(question, language) {
        // في الإصدار النهائي، سيتم الاتصال بالخادم الحقيقي
        // const response = await fetch(`${this.API_BASE}/ask`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ question, language })
        // });
        // return await response.json();

        // إرجاع إجابة تجريبية للاختبار
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    answer: this.generateDemoAnswer(question, language),
                    question: question,
                    language: language,
                    timestamp: new Date().toISOString()
                });
            }, 2000);
        });
    }

    // توليد إجابة تجريبية (للاختبار)
    generateDemoAnswer(question, language) {
        const answers = {
            javascript: {
                'كيف أنشئ دالة في JavaScript؟': `# إنشاء الدوال في JavaScript

هناك عدة طرق لإنشاء دوال في JavaScript:

## 1. Function Declaration
\`\`\`javascript
function greet(name) {
    return 'Hello, ' + name + '!';
}

console.log(greet('Ahmed')); // Hello, Ahmed!
\`\`\`

## 2. Function Expression
\`\`\`javascript
const greet = function(name) {
    return 'Hello, ' + name + '!';
};

console.log(greet('Ahmed')); // Hello, Ahmed!
\`\`\`

## 3. Arrow Function (ES6)
\`\`\`javascript
const greet = (name) => {
    return 'Hello, ' + name + '!';
};

// أو بشكل مختصر
const greetShort = name => 'Hello, ' + name + '!';

console.log(greet('Ahmed')); // Hello, Ahmed!
\`\`\`

## 4. Constructor Function
\`\`\`javascript
function Person(name) {
    this.name = name;
    this.greet = function() {
        return 'Hello, ' + this.name + '!';
    };
}

const person = new Person('Ahmed');
console.log(person.greet()); // Hello, Ahmed!
\`\`\`

## نصائح مهمة:
- استخدم **Arrow Functions** للدوال القصيرة
- استخدم **Function Declaration** للدوال التي تحتاج إلى hoisting
- تجنب **Constructor Functions** إلا عند الحاجة للبرمجة الكائنية`,

                'ما الفرق بين let و var في JavaScript؟': `# الفرق بين let و var في JavaScript

## 1. Scope (النطاق)

### var - Function Scope
\`\`\`javascript
function testVar() {
    if (true) {
        var x = 10;
    }
    console.log(x); // 10 - متاح خارج الـ block
}
\`\`\`

### let - Block Scope
\`\`\`javascript
function testLet() {
    if (true) {
        let y = 10;
    }
    console.log(y); // ReferenceError: y is not defined
}
\`\`\`

## 2. Hoisting (الرفع)

### var - يتم الرفع مع undefined
\`\`\`javascript
console.log(a); // undefined
var a = 5;
\`\`\`

### let - يتم الرفع ولكن لا يمكن الوصول
\`\`\`javascript
console.log(b); // ReferenceError
let b = 5;
\`\`\`

## 3. إعادة التعريف

### var - يمكن إعادة التعريف
\`\`\`javascript
var x = 1;
var x = 2; // صحيح
\`\`\`

### let - لا يمكن إعادة التعريف
\`\`\`javascript
let y = 1;
let y = 2; // SyntaxError
\`\`\`

## نصيحة:
استخدم **let** دائمًا بدلاً من **var** لتجنب الأخطاء الشائعة.`
            },
            python: {
                'كيف أتعامل مع الـ APIs في Python؟': `# التعامل مع الـ APIs في Python

## استخدام مكتبة requests

### 1. تثبيت المكتبة
\`\`\`bash
pip install requests
\`\`\`

### 2. طلب GET بسيط
\`\`\`python
import requests

response = requests.get('https://api.example.com/data')
data = response.json()
print(data)
\`\`\`

### 3. طلب POST مع بيانات
\`\`\`python
import requests

data = {
    'name': 'Ahmed',
    'email': 'ahmed@example.com'
}

response = requests.post('https://api.example.com/users', json=data)

if response.status_code == 200:
    print('تم إنشاء المستخدم بنجاح')
    print(response.json())
else:
    print('حدث خطأ:', response.status_code)
\`\`\`

### 4. إضافة headers
\`\`\`python
headers = {
    'Authorization': 'Bearer your-token-here',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.example.com/protected',
    headers=headers
)
\`\`\`

### 5. معالجة الأخطاء
\`\`\`python
try:
    response = requests.get('https://api.example.com/data', timeout=5)
    response.raise_for_status()  # يرفع استثناء للأخطاء HTTP
    data = response.json()
except requests.exceptions.RequestException as e:
    print('حدث خطأ في الاتصال:', e)
\`\`\`

## استخدام مكتبة httpx (بديل حديث)
\`\`\`python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get('https://api.example.com/data')
    data = response.json()
\`\`\``
            }
        };

        const langAnswers = answers[language] || answers['javascript'];
        return langAnswers[question] || `# إجابة على سؤالك: "${question}"

هذا مثال على الإجابة التي ستحصل عليها من الذكاء الاصطناعي.

## الخطوات الأساسية:

1. **فهم المشكلة**: ${question}
2. **الحل المقترح**: هذا نموذج للإجابة الحقيقية
3. **الأمثلة العملية**:

\`\`\`${language || 'javascript'}
// مثال على الكود
function example() {
    console.log("هذا مثال تجريبي");
}
\`\`\`

## ملاحظات:
- في النسخة الكاملة، ستتصل مع الذكاء الاصطناعي الحقيقي
- ستحصل على إجابات دقيقة ومخصصة
- ستدعم جميع لغات البرمجة

**هذه إجابة تجريبية للاختبار فقط.**`;
    }

    // عرض الإجابة
    displayAnswer(answer) {
        this.answerContent.innerHTML = this.formatAnswer(answer);
        this.answerSection.style.display = 'block';

        // تطبيق تمييز الصyntax
        this.highlightCode();

        // التمرير إلى قسم الإجابة
        this.answerSection.scrollIntoView({ behavior: 'smooth' });
    }

    // عرض إجابة تجريبية
    displayDemoAnswer(question, language) {
        const demoAnswer = this.generateDemoAnswer(question, language);
        this.displayAnswer(demoAnswer);
    }

    // تنسيق الإجابة
    formatAnswer(answer) {
        // تحويل Markdown إلى HTML بسيط
        return answer
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/\n/g, '<br>');
    }

    // تمييز الصyntax
    highlightCode() {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    // نسخ الإجابة
    copyAnswer() {
        const textToCopy = this.answerContent.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.showNotification('تم نسخ الإجابة بنجاح', 'success');
        }).catch(() => {
            this.showNotification('فشل في نسخ الإجابة', 'error');
        });
    }

    // حفظ السؤال
    saveQuestion() {
        if (!this.currentUser) {
            this.showNotification('يرجى تسجيل الدخول لحفظ الأسئلة', 'warning');
            this.showModal(this.loginModal);
            return;
        }

        this.showNotification('تم حفظ السؤال في المفضلة', 'success');
    }

    // إدارة الحالة
    setLoadingState(loading) {
        if (loading) {
            this.askBtn.innerHTML = '<div class="loading"></div> جاري البحث...';
            this.askBtn.disabled = true;
        } else {
            this.askBtn.innerHTML = '<i class="fas fa-paper-plane"></i> اطرح السؤال';
            this.askBtn.disabled = false;
        }
    }

    // إدارة النماذج المنبثقة
    showModal(modal) {
        modal.classList.add('show');
    }

    hideModal(modal) {
        modal.classList.remove('show');
    }

    hideModals() {
        this.hideModal(this.loginModal);
        this.hideModal(this.registerModal);
    }

    // معالجة إرسال النماذج
    handleFormSubmit(form) {
        const formId = form.closest('.modal').id;

        if (formId === 'loginModal') {
            this.handleLogin(form);
        } else if (formId === 'registerModal') {
            this.handleRegister(form);
        }
    }

    // معالجة تسجيل الدخول
    handleLogin(form) {
        const email = form.querySelector('#email').value;
        const password = form.querySelector('#password').value;

        // محاكاة تسجيل الدخول
        this.currentUser = {
            id: 1,
            name: 'مستخدم تجريبي',
            email: email
        };

        this.hideModals();
        this.showNotification('تم تسجيل الدخول بنجاح', 'success');
        this.updateAuthUI();
    }

    // معالجة التسجيل
    handleRegister(form) {
        const name = form.querySelector('#regName').value;
        const email = form.querySelector('#regEmail').value;
        const password = form.querySelector('#regPassword').value;

        // محاكاة التسجيل
        this.currentUser = {
            id: 1,
            name: name,
            email: email
        };

        this.hideModals();
        this.showNotification('تم إنشاء الحساب بنجاح', 'success');
        this.updateAuthUI();
    }

    // تحديث واجهة المستخدم حسب حالة المصادقة
    updateAuthUI() {
        if (this.currentUser) {
            this.loginBtn.innerHTML = `<i class="fas fa-user"></i> ${this.currentUser.name}`;
        } else {
            this.loginBtn.innerHTML = '<i class="fas fa-user"></i> تسجيل الدخول';
        }
    }

    // التحقق من حالة المصادقة
    checkAuthStatus() {
        // في الإصدار النهائي، سيتم التحقق من token
        const savedUser = localStorage.getItem('codeq_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateAuthUI();
        }
    }

    // تبديل السمة
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('codeq_theme', newTheme);

        const icon = this.themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

        const themeName = newTheme === 'dark' ? 'الداكن' : 'الفاتح';
        this.showNotification(`تم التبديل إلى الوضع ${themeName}`, 'info');
    }

    // تحميل السمة
    loadTheme() {
        const savedTheme = localStorage.getItem('codeq_theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);

        const icon = this.themeToggle.querySelector('i');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // عرض الإشعارات
    showNotification(message, type) {
        // إزالة الإشعارات السابقة
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // إنشاء إشعار جديد
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        // إضافة الأنماط
        const backgroundColor = type === 'error' ? '#ef4444' :
            type === 'warning' ? '#f59e0b' :
            type === 'success' ? '#10b981' : '#3b82f6';

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(-100%);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        const self = this;
        // عرض الإشعار
        setTimeout(function() {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // إخفاء الإشعار بعد 4 ثوان
        setTimeout(function() {
            notification.style.transform = 'translateX(-100%)';
            notification.style.opacity = '0';
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.codeQApp = new CodeQApp();
});