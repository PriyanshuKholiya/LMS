import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Send, 
  BookOpen, 
  HelpCircle, 
  Calendar, 
  FileText,
  Sparkles,
  ArrowRight,
  User,
  Bot
} from 'lucide-react';
import { courseService } from '../../services/courses';
import { type MockCourse } from '../../services/api';

interface Message {
  sender: 'USER' | 'AI';
  content: string;
  timestamp: Date;
}

const mockResponses: Record<string, Record<string, string>> = {
  'course-dl-101': {
    'default': "I'm your Deep Learning AI assistant. Ask me anything about Neural Networks, Loss Functions, Gradient Descent, or Backpropagation!",
    'backpropagation': "Backpropagation is the core algorithm used to train neural networks. It uses the mathematical **chain rule** to calculate the gradient of the loss function with respect to each weight in the network, working backward from the output layer to the input layer. This allows gradient descent to update weights and minimize loss.",
    'activation': "Activation functions introduce non-linearities into neural networks. Without them, no matter how many layers a network has, it would behave like a single linear model. Popular activations include:\n* **ReLU (Rectified Linear Unit)**: f(x) = max(0, x). Fast and prevents vanishing gradients.\n* **Sigmoid**: Outputs values between 0 and 1. Great for binary classification outputs.\n* **Tanh**: Outputs values between -1 and 1. Zero-centered, which aids optimizer convergence.",
    'explain': "### Gradient Descent Explained\nGradient descent is an optimization algorithm used to minimize the loss function by iteratively moving in the direction of steepest descent. Think of it as navigating down a foggy mountain to reach the lowest valley: you look at the slope at your current position and take a step downward.",
    'quiz': "### Practice Quiz: Deep Learning foundations\n\n**Q1: What is the main advantage of the ReLU activation function over Sigmoid?**\n✓ (1) It prevents the vanishing gradient problem during backpropagation.\n  (2) It limits values between 0 and 1.\n  (3) It is fully linear across all input ranges.\n\n**Q2: Which calculus rule is backpropagation based on?**\n✓ (1) Chain Rule\n  (2) Quotient Rule\n  (3) Product Rule\n\nTry answering these to check your concept clarity!",
    'schedule': "### 4-Week Deep Learning Study Plan\n\n* **Week 1: Foundations & Perceptrons**\n  Learn about single-layer perceptrons, weights, biases, and activation functions.\n* **Week 2: Deep Networks & Backpropagation**\n  Study multi-layer neural networks and the backpropagation math.\n* **Week 3: CNNs & Image Processing**\n  Understand Convolutional layers, pooling, and feature mapping.\n* **Week 4: Optimization & Regularization**\n  Explore SGD, Adam, Dropout, and Batch Normalization."
  },
  'course-db-202': {
    'default': "I'm your Database Systems AI assistant. Ask me about Relational Algebra, SQL queries, Normalization (1NF, 2NF, 3NF), or Indexing!",
    'normalization': "Database Normalization is the process of organizing fields and tables to minimize redundancy and dependency. It divides large tables into smaller ones and defines relationships between them. Common forms are:\n* **1NF**: Eliminate duplicate columns; ensure atomic values.\n* **2NF**: Meet 1NF; ensure all non-key attributes are fully functional-dependent on the primary key.\n* **3NF**: Meet 2NF; ensure no transitive functional dependencies exist.",
    'indexing': "Database Indexing is a data structure technique (usually using **B-Trees** or **Hash Indexes**) that speeds up data retrieval operations on a table at the cost of additional writes and storage space. Think of it like a book index: instead of scanning every page (table scan), you look up the keyword directly.",
    'explain': "### Relational Database Transactions\nTransactions represent a single logical unit of work. To ensure integrity, they must satisfy the **ACID** properties:\n* **Atomicity**: All operations succeed, or none do (All-or-Nothing).\n* **Consistency**: The database transitions from one valid state to another.\n* **Isolation**: Transactions run concurrently without interfering with each other.\n* **Durability**: Completed updates persist even during a system crash.",
    'quiz': "### Practice Quiz: Normalization & SQL\n\n**Q1: Which normal form requires that there are no transitive functional dependencies?**\n✓ (1) Third Normal Form (3NF)\n  (2) Second Normal Form (2NF)\n  (3) Boyce-Codd Normal Form (BCNF)\n\n**Q2: Which index type is best suited for range queries (e.g. BETWEEN)?**\n✓ (1) B-Tree Index\n  (2) Hash Index\n  (3) Bitmapped Index\n\nHow do these look? Let me know if you want the answers explained!",
    'schedule': "### 4-Week Database Systems Study Plan\n\n* **Week 1: ER Diagrams & Schema Design**\n  Learn how to model entities, attributes, relationships, and keys.\n* **Week 2: Relational Algebra & Basic SQL**\n  Master SELECT, JOIN, GROUP BY, and subqueries.\n* **Week 3: Normalization Theory**\n  Deep dive into functional dependencies, 2NF, 3NF, and BCNF.\n* **Week 4: Storage, Indexing, and Transactions**\n  Study B-Trees, hashing, and ACID transaction locks."
  }
};

export const AITutor: React.FC = () => {
  const [courses, setCourses] = useState<MockCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isApiLive, setIsApiLive] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load enrolled courses and check API health
  useEffect(() => {
    const init = async () => {
      try {
        const list = await courseService.getCourses();
        const enrolled = list.filter(c => c.enrolled);
        setCourses(enrolled);
        if (enrolled.length > 0) {
          setSelectedCourse(enrolled[0]);
        }

        // Check if backend API is online
        const res = await fetch('http://localhost:8000/api/v1/courses', { method: 'HEAD', mode: 'no-cors' }).catch(() => null);
        setIsApiLive(!!res);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  // Update initial message when course changes
  useEffect(() => {
    if (selectedCourse) {
      const courseMock = mockResponses[selectedCourse.id] || mockResponses['course-dl-101'];
      setMessages([
        {
          sender: 'AI',
          content: courseMock.default,
          timestamp: new Date()
        }
      ]);
      setActiveChatId(null);
    }
  }, [selectedCourse]);

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedCourse) return;

    const userText = inputText;
    setInputText('');

    // Append user message
    const userMsg: Message = { sender: 'USER', content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    if (isApiLive) {
      try {
        let chatId = activeChatId;
        const headers: any = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        };

        // Create chat if none active
        if (!chatId) {
          const createChatRes = await fetch('http://localhost:8000/api/v1/ai_tutor/chats', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              course_id: selectedCourse.id,
              student_id: JSON.parse(localStorage.getItem('aegis_user_profile') || '{}').id || 'student-id-123'
            })
          });
          if (createChatRes.ok) {
            const chatData = await createChatRes.json();
            chatId = chatData.id;
            setActiveChatId(chatId);
          }
        }

        const msgRes = await fetch(`http://localhost:8000/api/v1/ai_tutor/chats/${chatId}/messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: userText })
        });
        if (msgRes.ok) {
          const replyData = await msgRes.json();
          setMessages(prev => [...prev, {
            sender: 'AI',
            content: replyData.content,
            timestamp: new Date()
          }]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.warn("API error, falling back to local simulation.", err);
      }
    }

    // Local Mock Mode response with organic delay
    setTimeout(() => {
      const courseMock = mockResponses[selectedCourse.id] || mockResponses['course-dl-101'];
      const normalizedQuery = userText.toLowerCase();
      let reply = "I'm processing that question. In the sandbox, you can ask about: " + 
                  (selectedCourse.id === 'course-dl-101' ? "**Backpropagation** or **Activation** functions." : "**Normalization** or **Indexing**.");
      
      if (normalizedQuery.includes('backpropagation') || normalizedQuery.includes('backprop')) {
        reply = courseMock.backpropagation;
      } else if (normalizedQuery.includes('activation') || normalizedQuery.includes('relu') || normalizedQuery.includes('sigmoid')) {
        reply = courseMock.activation;
      } else if (normalizedQuery.includes('normaliz') || normalizedQuery.includes('normal form') || normalizedQuery.includes('3nf')) {
        reply = courseMock.normalization;
      } else if (normalizedQuery.includes('index') || normalizedQuery.includes('b-tree')) {
        reply = courseMock.indexing;
      }

      setMessages(prev => [...prev, {
        sender: 'AI',
        content: reply,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000);
  };

  // Trigger quick action endpoints
  const triggerQuickAction = async (action: 'explain' | 'quiz' | 'schedule' | 'summarize') => {
    if (!selectedCourse) return;
    setIsTyping(true);

    // Append mock user input for logs
    let queryText = "";
    if (action === 'explain') queryText = "Explain concepts in detail.";
    else if (action === 'quiz') queryText = "Generate a practice quiz.";
    else if (action === 'schedule') queryText = "Generate a study schedule.";
    else if (action === 'summarize') queryText = "Summarize uploaded course materials.";

    setMessages(prev => [...prev, {
      sender: 'USER',
      content: queryText,
      timestamp: new Date()
    }]);

    if (isApiLive) {
      try {
        let chatId = activeChatId;
        const headers: any = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        };

        if (!chatId) {
          const createChatRes = await fetch('http://localhost:8000/api/v1/ai_tutor/chats', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              course_id: selectedCourse.id,
              student_id: JSON.parse(localStorage.getItem('aegis_user_profile') || '{}').id || 'student-id-123'
            })
          });
          if (createChatRes.ok) {
            const chatData = await createChatRes.json();
            chatId = chatData.id;
            setActiveChatId(chatId);
          }
        }

        let endpoint = `http://localhost:8000/api/v1/ai_tutor/chats/${chatId}/messages`;
        let bodyPayload: any = { content: queryText };

        if (action === 'explain') {
          endpoint = `http://localhost:8000/api/v1/ai_tutor/chats/${chatId}/explain`;
          bodyPayload = { 
            concept_name: selectedCourse.id === 'course-dl-101' ? 'Gradient Descent' : 'Relational Transactions',
            course_title: selectedCourse.title
          };
        } else if (action === 'quiz') {
          endpoint = `http://localhost:8000/api/v1/ai_tutor/chats/${chatId}/mcqs`;
          bodyPayload = { 
            topic: selectedCourse.id === 'course-dl-101' ? 'Neural Networks' : 'SQL Normalization',
            num_questions: 2
          };
        } else if (action === 'schedule') {
          endpoint = `http://localhost:8000/api/v1/ai_tutor/chats/${chatId}/study-plan`;
          bodyPayload = { 
            topic: selectedCourse.title,
            duration_weeks: 4
          };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload)
        });
        if (res.ok) {
          const replyData = await res.json();
          setMessages(prev => [...prev, {
            sender: 'AI',
            content: replyData.content,
            timestamp: new Date()
          }]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.warn("API action error, running local fallback.", err);
      }
    }

    // Local Mock responses
    setTimeout(() => {
      const courseMock = mockResponses[selectedCourse.id] || mockResponses['course-dl-101'];
      let replyText = "";
      if (action === 'explain') replyText = courseMock.explain;
      else if (action === 'quiz') replyText = courseMock.quiz;
      else if (action === 'schedule') replyText = courseMock.schedule;
      else if (action === 'summarize') {
        replyText = "### Document Summary: Deep Learning Lecture Slides\n\n" + 
                    "This document covers multi-layer feedforward networks, cost calculations, and structural backpropagation steps.\n\n" + 
                    "**Key Takeaways**:\n" + 
                    "1. Matrix representations speed up batch weight computations.\n" + 
                    "2. The vanishing gradient problem limits deep Sigmoid networks, which is resolved by swapping to ReLU activation shapes.";
      }

      setMessages(prev => [...prev, {
        sender: 'AI',
        content: replyText,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000);
  };

  // Convert simple markdown list or bold symbols to HTML tags safely
  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      let content = line;
      
      // Parse Bold
      const boldRegex = /\*\*(.*?)\*\*/g;
      content = content.replace(boldRegex, '<strong>$1</strong>');

      // Parse bullet points
      if (content.startsWith('* ')) {
        return <li key={i} style={{ marginLeft: '20px', padding: '2px 0' }} dangerouslySetInnerHTML={{ __html: content.substring(2) }} />;
      }
      if (content.startsWith('✓ ')) {
        return <div key={i} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: content }} />;
      }

      // Parse Headers
      if (content.startsWith('### ')) {
        return <h4 key={i} style={{ fontSize: '1.05rem', fontWeight: 700, margin: '14px 0 8px 0', color: 'var(--primary)' }}>{content.substring(4)}</h4>;
      }

      return <p key={i} style={{ margin: '4px 0', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: content }} />;
    });
  };

  if (courses.length === 0) {
    return (
      <div style={styles.emptyContainer} className="glass-panel">
        <BrainCircuit size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>No Enrolled Courses Found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 20px 0', textAlign: 'center', maxWidth: '380px' }}>
          Please browse the Course Catalog and enroll in a course to activate your personalized AI Tutor chatbot.
        </p>
        <a href="/student/courses" className="btn btn-primary">
          Open Course Catalog
        </a>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Side bar quick actions */}
      <div style={styles.sidebar} className="glass-panel">
        <div style={styles.courseSection}>
          <label style={styles.label}>Select Course Subject:</label>
          <select 
            value={selectedCourse?.id || ''} 
            onChange={(e) => {
              const selected = courses.find(c => c.id === e.target.value);
              if (selected) setSelectedCourse(selected);
            }}
            style={styles.selectInput}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div style={styles.divider} />

        <div style={styles.actionsSection}>
          <span style={styles.label}>Tutor Quick Tools:</span>
          <div style={styles.actionButtons}>
            <button onClick={() => triggerQuickAction('explain')} style={styles.actionBtn} className="transition-all hover-scale">
              <BookOpen size={16} color="var(--primary)" />
              <div style={{ textAlign: 'left' }}>
                <div style={styles.actionTitle}>Explain Concept</div>
                <div style={styles.actionDesc}>Get details on course topics</div>
              </div>
              <ArrowRight size={14} style={styles.actionArrow} />
            </button>

            <button onClick={() => triggerQuickAction('quiz')} style={styles.actionBtn} className="transition-all hover-scale">
              <HelpCircle size={16} color="#10b981" />
              <div style={{ textAlign: 'left' }}>
                <div style={styles.actionTitle}>Practice Quiz</div>
                <div style={styles.actionDesc}>Test your knowledge now</div>
              </div>
              <ArrowRight size={14} style={styles.actionArrow} />
            </button>

            <button onClick={() => triggerQuickAction('schedule')} style={styles.actionBtn} className="transition-all hover-scale">
              <Calendar size={16} color="#f59e0b" />
              <div style={{ textAlign: 'left' }}>
                <div style={styles.actionTitle}>Study Schedule</div>
                <div style={styles.actionDesc}>Create custom study timeline</div>
              </div>
              <ArrowRight size={14} style={styles.actionArrow} />
            </button>

            <button onClick={() => triggerQuickAction('summarize')} style={styles.actionBtn} className="transition-all hover-scale">
              <FileText size={16} color="#ef4444" />
              <div style={{ textAlign: 'left' }}>
                <div style={styles.actionTitle}>Summarize PDF</div>
                <div style={styles.actionDesc}>Condense slides & materials</div>
              </div>
              <ArrowRight size={14} style={styles.actionArrow} />
            </button>
          </div>
        </div>
      </div>

      {/* Main chat box layout */}
      <div style={styles.chatWrapper} className="glass-panel">
        {/* Chat header */}
        <div style={styles.chatHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.tutorAvatar}>
              <BrainCircuit size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Aegis RAG Tutor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={styles.onlineDot} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedCourse?.title} assistant
                </span>
              </div>
            </div>
          </div>
          
          <div style={styles.apiBadge}>
            {isApiLive ? (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} /> Live API
              </span>
            ) : (
              <span style={{ color: '#f59e0b' }}>Local Sandbox</span>
            )}
          </div>
        </div>

        {/* Messages body list */}
        <div style={styles.messagesList}>
          {messages.map((msg, i) => (
            <div 
              key={i} 
              style={{
                ...styles.messageItem,
                justifyContent: msg.sender === 'USER' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ display: 'flex', gap: '10px', maxWidth: '75%', alignItems: 'flex-start', flexDirection: msg.sender === 'USER' ? 'row-reverse' : 'row' }}>
                <div style={{
                  ...styles.avatarSmall,
                  background: msg.sender === 'USER' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: msg.sender === 'USER' ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.sender === 'USER' ? <User size={12} color="#000000" /> : <Bot size={12} color="var(--primary)" />}
                </div>
                <div 
                  style={{
                    ...styles.bubble,
                    background: msg.sender === 'USER' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                    border: msg.sender === 'USER' ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border)',
                    borderRadius: msg.sender === 'USER' ? '14px 2px 14px 14px' : '2px 14px 14px 14px'
                  }}
                >
                  {formatMessage(msg.content)}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ ...styles.messageItem, justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ ...styles.avatarSmall, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                  <Bot size={12} color="var(--primary)" />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Tutor is analyzing slides...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} style={styles.inputForm}>
          <input
            type="text"
            placeholder={`Ask about ${selectedCourse?.title} topics (e.g. ${selectedCourse?.id === 'course-dl-101' ? 'Backpropagation' : 'Normalization'})...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            style={styles.chatInput}
          />
          <button type="submit" disabled={isTyping || !inputText.trim()} style={styles.sendBtn} className="transition-all hover-scale">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px',
    height: 'calc(100vh - 120px)',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '8px 0'
  },
  sidebar: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%'
  },
  courseSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  selectInput: {
    background: 'rgba(9, 9, 11, 0.6)'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)'
  },
  actionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  actionBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s'
  },
  actionTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#ffffff'
  },
  actionDesc: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  actionArrow: {
    position: 'absolute',
    right: '12px',
    color: 'var(--text-muted)'
  },
  chatWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  chatHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tutorAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary-hover), var(--border))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  onlineDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981'
  },
  apiBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  messagesList: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  messageItem: {
    display: 'flex',
    width: '100%'
  },
  avatarSmall: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  bubble: {
    padding: '12px 16px',
    fontSize: '0.92rem',
    color: '#cbd5e1',
    boxShadow: 'var(--shadow-sm)'
  },
  inputForm: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    gap: '12px'
  },
  chatInput: {
    flex: 1,
    background: 'rgba(9, 9, 11, 0.6)'
  },
  sendBtn: {
    background: 'var(--primary)',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    maxWidth: '500px',
    margin: '100px auto',
    textAlign: 'center'
  }
};
