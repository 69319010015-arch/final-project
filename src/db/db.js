import Dexie from 'dexie';

// 1. Initialize Dexie Database
export const db = new Dexie('ITHelpDeskDB');

db.version(1).stores({
  users: '++id, username, password, fullName, role, avatar',
  tickets: '++id, title, description, category, priority, status, requesterId, assigneeId, createdAt, updatedAt',
  comments: '++id, ticketId, senderId, message, createdAt',
  articles: '++id, title, content, category, views, createdAt',
  notifications: '++id, userId, message, type, isRead, ticketId, createdAt'
});

// 2. Mock Data for Initial Database Seeding
const MOCK_USERS = [
  {
    username: 'user1',
    password: 'password',
    fullName: 'สมชาย ใจดี (พนักงานบัญชี)',
    role: 'requester',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60'
  },
  {
    username: 'user2',
    password: 'password',
    fullName: 'สมศรี รักเรียน (ฝ่ายขาย)',
    role: 'requester',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60'
  },
  {
    username: 'tech1',
    password: 'password',
    fullName: 'วิชัย ไอทีคลินิก (IT Support L1)',
    role: 'technician',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60'
  },
  {
    username: 'tech2',
    password: 'password',
    fullName: 'กฤษฎา ซ่อมคอม (Network Engineer)',
    role: 'technician',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60'
  },
  {
    username: 'admin',
    password: 'password',
    fullName: 'นรินทร์ คุมระบบ (IT Manager & Admin)',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60'
  }
];

const MOCK_ARTICLES = [
  {
    title: 'วิธีรีเซ็ตรหัสผ่านอีเมลบริษัทด้วยตัวเอง',
    category: 'Account & Security',
    views: 42,
    content: `หากคุณลืมรหัสผ่านของระบบเมลบริษัท หรือรหัสผ่านหมดอายุ (ต้องเปลี่ยนทุก 90 วัน) สามารถทำตามวิธีนี้เพื่อเปลี่ยนด้วยตนเองได้:
1. เข้าไปที่หน้าเว็บ **portal.office.com** หรือลิงก์รีเซ็ตรหัสผ่านหลัก
2. ป้อนอีเมลบริษัทของคุณ เช่น \`user@company.com\`
3. เลือก "ลืมรหัสผ่านของฉัน" (Forgot my password)
4. ยืนยันตัวตนผ่านเบอร์มือถือหรืออีเมลสำรองที่ลงทะเบียนไว้ในระบบ (MFA)
5. กรอกรหัสความปลอดภัยที่ได้รับ และตั้งรหัสผ่านใหม่ตามกฎความปลอดภัย (อย่างน้อย 12 ตัวอักษร มีตัวใหญ่ ตัวเล็ก ตัวเลข และอักขระพิเศษ)

*หมายเหตุ: หากระบบแจ้งว่าบัญชีของคุณถูกล็อก (Locked Account) กรุณาแจ้งตั๋วเพื่อให้เจ้าหน้าที่ปลดล็อกให้*`,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'ขั้นตอนการเชื่อมต่อ VPN ของบริษัทจากภายนอก (WFH)',
    category: 'Network',
    views: 118,
    content: `คู่มือนี้สำหรับการเข้าใช้งานเครือข่ายบริษัทจากที่บ้านหรือนอกสำนักงาน:
1. เปิดโปรแกรม **FortiClient VPN** บนเครื่องโน้ตบุ๊กของคุณ
2. เลือก VPN Name: **Company-Remote-VPN**
3. ป้อน Username และ Password ของอีเมลบริษัทของคุณ
4. ระบบจะส่งรหัส OTP ไปที่แอปพลิเคชัน Authenticator บนโทรศัพท์มือถือของคุณ
5. นำรหัส 6 หลักมากรอกในช่อง OTP และกด Connect
6. เมื่อเชื่อมต่อสำเร็จ ไอคอนโปรแกรมจะเปลี่ยนเป็นสีเขียวและมีรูปแม่กุญแจล็อก

**ข้อควรระวัง:** 
- ความเร็วอินเทอร์เน็ตที่บ้านควรมีอย่างน้อย 30 Mbps เพื่อการทำงานที่เสถียร
- หากระบบไม่สามารถเชื่อมต่อได้ ให้ปิดสัญญาณไวไฟแล้วเปิดใหม่ หรือเชื่อมต่อผ่านสาย LAN`,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'วิธีแก้ไขปัญหาปริ้นเตอร์พิมพ์ไม่ออกเบื้องต้น',
    category: 'Hardware',
    views: 15,
    content: `เมื่อสั่งพิมพ์เอกสารแล้วเครื่องปริ้นเตอร์ไม่มีการตอบสนอง ให้ทำตามขั้นตอนการตรวจสอบดังนี้:
1. **ตรวจสอบสถานะเครื่อง:** ดูว่าเครื่องมีไฟสีแดงกระพริบหรือไม่, กระดาษหมด, หรือหมึกหมดหรือไม่
2. **ตรวจสอบการเชื่อมต่อ:** หากเป็นสาย USB ให้ถอดออกแล้วเสียบใหม่ หากเป็นเครื่องพิมพ์เครือข่าย (Network Printer) ตรวจดูว่าสายแลนเสียบแน่นหนาหรือโน้ตบุ๊กต่อเน็ตเวิร์กเดียวกันอยู่หรือไม่
3. **ตรวจสอบ Print Queue:**
   - ไปที่ Settings > Devices > Printers & Scanners
   - คลิกที่ชื่อปริ้นเตอร์ของคุณ แล้วเลือก **Open queue**
   - ตรวจดูว่ามีตั๋วค้างในแถวคิวหรือไม่ หากมี ให้คลิกขวาแล้วกด Cancel All Documents
4. **รีสตาร์ท Print Spooler (สำหรับ Windows):**
   - กดปุ่ม Windows + R พิมพ์ \`services.msc\` แล้วกด Enter
   - หาบริการชื่อ **Print Spooler** คลิกขวาแล้วกด **Restart**
   - ลองสั่งพิมพ์งานใหม่อีกครั้ง`,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'วิธีตั้งค่าอีเมลบริษัทบนโปรแกรม Outlook ในโทรศัพท์มือถือ',
    category: 'Software',
    views: 89,
    content: `คุณสามารถอ่านและส่งเมลบริษัทบนอุปกรณ์ iOS และ Android ได้สะดวกผ่านแอปพลิเคชันอย่างเป็นทางการ:
1. ดาวน์โหลดแอปพลิเคชัน **Microsoft Outlook** จาก App Store หรือ Google Play Store
2. เปิดแอปพลิเคชัน และป้อนอีเมลที่ทำงานของคุณ เช่น \`yourname@company.com\`
3. แตะ **Add Account**
4. กรอกรหัสผ่านบัญชีบริษัทของคุณ
5. ยืนยันตัวตนผ่านระบบตรวจสอบ 2 ขั้นตอน (MFA Authenticator)
6. ระบบจะถามหาการยินยอมนโยบายความปลอดภัยของบริษัท (Intune Portal) ให้แตะ **Accept/Activate** เพื่อใช้งาน

*หมายเหตุ: ห้ามใช้แอปพลิเคชัน Mail ที่แถมมากับตัวเครื่องเนื่องจากไม่ผ่านเกณฑ์ความปลอดภัยของบริษัท*`,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

const MOCK_TICKETS = [
  {
    title: 'ต่อเน็ตบริษัทไม่ได้ สัญญาณขึ้น No Internet Access',
    description: 'โน้ตบุ๊กของผมต่อสัญญาณ Wi-Fi ชื่อ Company_Staff_Secure ได้แล้ว แต่มีสัญลักษณ์เครื่องหมายตกใจสีเหลือง และใช้งานเว็บเบราว์เซอร์ไม่ได้เลยครับ รบกวนเจ้าหน้าที่ไอทีช่วยตรวจสอบจุดนี้ให้หน่อยครับ',
    category: 'Network',
    priority: 'high',
    status: 'open',
    requesterId: 1, // สมชาย
    assigneeId: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    title: 'หน้าจอคอมพิวเตอร์ดับและเปิดไม่ติด มีไฟสีส้มกระพริบ',
    description: 'เปิดเครื่อง PC แล้วพัดลมเครื่องทำงาน แต่หน้าจอ Monitor แบรนด์ Dell ที่ต่อคู่กันไม่แสดงผลอะไรเลย มีแค่ไฟปุ่มเปิดสีส้มกระพริบไปมา ลองขยับสายไฟและสาย VGA ด้านหลังเคสแล้วยังไม่หายค่ะ',
    category: 'Hardware',
    priority: 'medium',
    status: 'in_progress',
    requesterId: 2, // สมศรี
    assigneeId: 3, // วิชัย
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // updated 4 hours ago
  },
  {
    title: 'ต้องการขอติดตั้งโปรแกรม Adobe Photoshop สำหรับงานออกแบบ',
    description: 'จากที่ตกลงกับผู้จัดการฝ่ายเรื่องแคมเปญใหม่ ดิฉันจำเป็นต้องใช้โปรแกรม Adobe Photoshop CC เพื่อทำอาร์ตเวิร์กส่งลูกค้า ได้ส่งใบคำขออนุมัติจัดซื้อซอฟต์แวร์ที่ลงนามเรียบร้อยแนบมาให้แล้วค่ะ',
    category: 'Software',
    priority: 'low',
    status: 'resolved',
    requesterId: 2, // สมศรี
    assigneeId: 3, // วิชัย
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // resolved 2 days ago
  },
  {
    title: 'บัญชีระบบ ERP โดนล็อกชั่วคราว ล็อกอินไม่ได้',
    description: 'กรอกรหัสผ่านเข้าระบบ ERP ผิดติดต่อกัน 3 ครั้ง ระบบขึ้นแจ้งเตือนว่า Account Locked ชั่วคราว รบกวนปลดล็อกให้ด่วนครับ ต้องใช้คีย์ข้อมูลส่งมอบของวันนี้ก่อนเวลา 17.00 น.',
    category: 'Account & Security',
    priority: 'high',
    status: 'closed',
    requesterId: 1, // สมชาย
    assigneeId: 4, // กฤษฎา
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // closed 4 days ago
  }
];

const MOCK_COMMENTS = [
  // For ticket 2 (PC Screen)
  {
    ticketId: 2,
    senderId: 3, // วิชัย (Tech)
    message: 'สวัสดีครับคุณสมศรี เบื้องต้นลองตรวจสอบช่องสัญญาณที่ตัวจอ Monitor หรือยังครับว่าเลือก Input Source ถูกต้อง (เช่น HDMI หรือ DisplayPort หรือ VGA) รบกวนกดปุ่มด้านล่างจอตรวจสอบดูครับ',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
  },
  {
    ticketId: 2,
    senderId: 2, // สมศรี (Requester)
    message: 'กดเช็คแล้วค่ะ จอขึ้นว่า No Cable Connected ตลอดเลย ลองสลับสายจอไปเสียบกับช่องอื่นๆ ด้านหลังก็ยังไม่หายค่ะ',
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000)
  },
  {
    ticketId: 2,
    senderId: 3, // วิชัย (Tech)
    message: 'รับทราบครับ เดี๋ยวช่วงบ่ายวันนี้ผมจะเดินไปตรวจเช็คสายต่อจอและการทำงานของการ์ดจอที่โต๊ะของคุณสมศรีด้วยตัวเองครับ',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  
  // For ticket 3 (Adobe Photoshop Request)
  {
    ticketId: 3,
    senderId: 3, // วิชัย (Tech)
    message: 'ได้รับใบขออนุมัติเรียบร้อยครับ กำลังดำเนินการเบิกสิทธิ์ License คาดว่าจะใช้เวลาประมาณ 1 วันทำการครับ',
    createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000)
  },
  {
    ticketId: 3,
    senderId: 3, // วิชัย (Tech)
    message: 'ดำเนินการติดตั้งและเปิดสิทธิ์ใช้งานสิทธิไลเซนส์ให้กับอีเมลบัญชีของคุณสมศรีเรียบร้อยแล้วนะครับ สามารถลงชื่อเข้าใช้ในโปรแกรม Creative Cloud เพื่อเปิดใช้ Photoshop ได้เลยครับ ขอเปลี่ยนสถานะเป็นตรวจเสร็จสิ้นนะครับ',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  
  // For ticket 4 (ERP Locked)
  {
    ticketId: 4,
    senderId: 4, // กฤษฎา (Tech)
    message: 'ได้ทำการปลดล็อกระบบ ERP ให้เรียบร้อยครับ และได้ทำการส่งรหัสผ่านชั่วคราวให้ในกล่องข้อความส่วนตัวแล้ว กรุณาล็อกอินและเปลี่ยนรหัสผ่านใหม่ทันทีครับ',
    createdAt: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000)
  },
  {
    ticketId: 4,
    senderId: 1, // สมชาย (Requester)
    message: 'ใช้งานได้ปกติแล้วครับ รหัสผ่านใหม่ตั้งเรียบร้อย ขอบคุณเจ้าหน้าที่ไอทีรวดเร็วมากครับ',
    createdAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000)
  }
];

// 3. Database Seeding Implementation
export async function seedDatabase() {
  const userCount = await db.users.count();
  if (userCount > 0) {
    // Already populated, skip seeding
    return;
  }

  console.log('Seeding Database...');
  
  // Add Users
  const userIds = [];
  for (const user of MOCK_USERS) {
    const id = await db.users.add(user);
    userIds.push(id);
  }
  
  // Add Articles
  for (const article of MOCK_ARTICLES) {
    await db.articles.add(article);
  }

  // Add Tickets (adjust requesterId and assigneeId mapping)
  // userIds: [1, 2, 3, 4, 5] -> user1, user2, tech1, tech2, admin
  const seededTickets = MOCK_TICKETS.map(ticket => {
    return {
      ...ticket,
      requesterId: ticket.requesterId === 1 ? userIds[0] : userIds[1],
      assigneeId: ticket.assigneeId === null ? null : (ticket.assigneeId === 3 ? userIds[2] : userIds[3])
    };
  });
  
  const ticketIds = [];
  for (const ticket of seededTickets) {
    const id = await db.tickets.add(ticket);
    ticketIds.push(id);
  }

  // Add Comments (map senderId to correct ID, map ticketId to correct ticket ID)
  // ticketIds list: [1, 2, 3, 4] maps 1-1 with MOCK_TICKETS
  const seededComments = MOCK_COMMENTS.map(comment => {
    let senderId;
    if (comment.senderId === 1) senderId = userIds[0];
    else if (comment.senderId === 2) senderId = userIds[1];
    else if (comment.senderId === 3) senderId = userIds[2];
    else if (comment.senderId === 4) senderId = userIds[3];
    
    return {
      ...comment,
      ticketId: ticketIds[comment.ticketId - 1], // map to the created ticket ID
      senderId
    };
  });

  for (const comment of seededComments) {
    await db.comments.add(comment);
  }

  // Add Initial Notifications for Demo
  const notifications = [
    {
      userId: userIds[0], // สมชาย
      message: 'บัญชีระบบ ERP โดนล็อกชั่วคราว ล็อกอินไม่ได้ ได้รับการเปลี่ยนสถานะเป็น Closed',
      type: 'status_change',
      isRead: 1,
      ticketId: ticketIds[3],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      userId: userIds[1], // สมศรี
      message: 'หน้าจอคอมพิวเตอร์ดับและเปิดไม่ติด ได้รับการเปลี่ยนสถานะเป็น In Progress',
      type: 'status_change',
      isRead: 0,
      ticketId: ticketIds[1],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      userId: userIds[2], // วิชัย
      message: 'ตั๋วปัญหาใหม่: ต่อเน็ตบริษัทไม่ได้ สัญญาณขึ้น No Internet Access ได้รับการลงทะเบียนในระบบ',
      type: 'new_ticket',
      isRead: 0,
      ticketId: ticketIds[0],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  for (const notification of notifications) {
    await db.notifications.add(notification);
  }

  console.log('Database Seeding Complete!');
}
