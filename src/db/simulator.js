import { db } from './db';

const SIM_TICKET_TEMPLATES = [
  {
    title: 'คีย์บอร์ดโน้ตบุ๊กพิมพ์ไม่ติดบางปุ่ม (ปุ่ม Spacebar และ Enter)',
    description: 'แป้นพิมพ์โน้ตบุ๊ก ThinkPad ของผมเริ่มมีปัญหาตั้งแต่เช้า ปุ่ม Spacebar และ Enter พิมพ์ไม่ติดเลย ต้องต่อคีย์บอร์ดนอกแทนถึงใช้งานได้ปกติ รบกวนช่วยตรวจสอบหรือเบิกแป้นใหม่ให้ด้วยครับ',
    category: 'Hardware',
    priority: 'medium'
  },
  {
    title: 'โปรแกรม Microsoft Excel ค้างบ่อยมากเวลาเปิดไฟล์ขนาดใหญ่',
    description: 'เวลาเปิดสเปรดชีตบัญชีที่มีสูตร VLOOKUP เยอะๆ โปรแกรมจะขึ้น Not Responding และค้างไปเลยค่ะ ทำให้ทำรายงานบัญชีปิดสิ้นเดือนไม่ทัน รบกวนเจ้าหน้าที่ไอทีช่วยดูให้หน่อยค่ะ',
    category: 'Software',
    priority: 'high'
  },
  {
    title: 'ต่อ WiFi โซนรับรองแขก (Company-Guest) ไม่ติด',
    description: 'ขณะนี้ลูกค้ามาติดต่อที่ห้องประชุม A บอร์ดบริหาร และต้องการต่อสัญญาณอินเทอร์เน็ตเพื่อนำเสนอสไลด์ แต่พยายามล็อกอินใช้ Company-Guest แล้วระบบแจ้งรหัสผ่านไม่ถูกต้อง รบกวนขอรหัสผ่านอัปเดตหน่อยครับ',
    category: 'Network',
    priority: 'high'
  },
  {
    title: 'มีอีเมลต้องสงสัยอ้างว่าส่งมาจากธนาคาร ส่งเข้ามาในเมลส่วนตัว',
    description: 'ได้รับอีเมลหัวข้อแจ้งว่า "บัญชีเงินฝากของคุณถูกระงับชั่วคราว กรุณายืนยันตัวตนใหม่" และมีปุ่มให้กดลิงก์ กลัวว่าจะเป็นสแปมหรือฟิชชิ่ง เลยแนบรูปภาพหน้าอีเมลส่งตั๋วมาให้ทางไอทีตรวจสอบความปลอดภัยครับ',
    category: 'Account & Security',
    priority: 'critical'
  },
  {
    title: 'เครื่องปริ้นเตอร์ HP แผนกการตลาดกระดาษติดบ่อยและมีเสียงดังแปลกๆ',
    description: 'เมื่อสั่งพิมพ์เครื่องจะดึงกระดาษซ้อนกันหลายแผ่นแล้วไปค้างด้านในกระบอกความร้อน และมีเสียงแกรกๆ ข้างในเครื่อง ลองเปิดดึงออกหลายรอบแล้วก็ยังติดอีก รบกวนช่วยส่งช่างมาดูให้ทีค่ะ',
    category: 'Hardware',
    priority: 'medium'
  },
  {
    title: 'ขอสิทธิ์การเข้าถึง Shared Folder แผนกทรัพยากรบุคคล (HR-Staff)',
    description: 'เพิ่งย้ายตำแหน่งมาแผนก HR ครับ ปัจจุบันยังเปิดโฟลเดอร์กลาง HR-Staff บนระบบไฟล์เซิร์ฟเวอร์ไม่ได้ ได้รับการอนุมัติจากผู้จัดการแผนกแล้ว รบกวนไอทีช่วยแอดสิทธิ์เข้ากลุ่ม AD Group ให้ทีครับ',
    category: 'Account & Security',
    priority: 'low'
  }
];

const SIM_COMMENT_TEMPLATES_SUPPORT = [
  'ทีมไอทีรับทราบปัญหารบกวนขอรหัสตัวเครื่อง (Asset Tag) ที่ติดอยู่ด้านหลังเครื่องด้วยครับ เพื่อเช็คประวัติการรับประกัน',
  'ตอนนี้กำลังเข้าหน้าเครื่องเพื่อตรวจสอบระบบ Log การเชื่อมต่อให้ ขอเวลาสืบค้นสาเหตุประมาณ 10 นาทีครับ',
  'ได้ลองรีสตาร์ทบริการเบื้องหลังของโปรแกรมแล้ว รบกวนลองปิดตัวโปรแกรมแล้วเข้าใหม่อีกครั้งเพื่อทดสอบครับ',
  'ขณะนี้มีผู้ใช้งานรายอื่นแจ้งเรื่องปัญหาทำนองเดียวกันเข้ามา น่าจะเป็นปัญหาที่ระบบเซิร์ฟเวอร์กลาง กำลังเร่งประสานงานแก้ไขครับ',
  'ผมตรวจสอบสายสัญญาณแล้วพบว่าชำรุด เดี๋ยวจะสลับนำอุปกรณ์ตัวสำรองมาให้เปลี่ยนใช้ชั่วคราวนะครับ',
  'ดำเนินการให้เรียบร้อยแล้วนะครับ รบกวนทดลองใช้งานและตอบกลับเพื่อยืนยัน หากเรียบร้อยดีจะขออนุญาตปิดตั๋วปัญหาชิ้นนี้ครับ'
];

const SIM_COMMENT_TEMPLATES_USER = [
  'รับทราบค่ะ ลองทำตามวิธีแนะนำแล้วยังไม่หาย เดี๋ยวจะรอเจ้าหน้าที่เดินมาตรวจเช็คที่โต๊ะนะคะ',
  'รหัสเครื่องไอทีคือ IT-NB-2024-0518 ค่ะ ตัวเครื่องยังอยู่ในประกันของบริษัท',
  'ลองปิดแล้วเปิดเครื่องใหม่รอบนึงแล้วค่ะ ตอนนี้สามารถใช้เชื่อมต่อได้ปกติเรียบร้อยแล้วค่ะ ขอบคุณมากค่ะ',
  'มีปุ่มอะไรให้กดส่งรูปภาพประกอบเพิ่มเติมไหมคะ อยากแชร์หน้าจอที่เกิด Error ให้ดู',
  'รับทราบครับ รบกวนแจ้งอัปเดตความคืบหน้าให้ผมทราบเป็นระยะๆ ด้วยนะครับ ขอบคุณทีมซัพพอร์ตครับ',
  'ใช้งานได้สมบูรณ์แบบแล้วครับ รหัสชั่วคราวล็อกอินแล้วเปลี่ยนเรียบร้อย ปิดตั๋วได้เลยครับ'
];

// Helper to get random item
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a random ticket
export async function simulateNewTicket() {
  // Get requesters
  const requesters = await db.users.where('role').equals('requester').toArray();
  if (requesters.length === 0) return null;
  
  const requester = randItem(requesters);
  const template = randItem(SIM_TICKET_TEMPLATES);
  
  const newTicket = {
    title: template.title + ' (จำลอง)',
    description: template.description,
    category: template.category,
    priority: template.priority,
    status: 'open',
    requesterId: requester.id,
    assigneeId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const ticketId = await db.tickets.add(newTicket);
  
  // Create notifications for all technicians and admins
  const staff = await db.users.where('role').anyOf(['technician', 'admin']).toArray();
  for (const person of staff) {
    await db.notifications.add({
      userId: person.id,
      message: `มีตั๋วแจ้งปัญหาใหม่: "${newTicket.title}" โดยคุณ ${requester.fullName.split(' ')[0]}`,
      type: 'new_ticket',
      isRead: 0,
      ticketId,
      createdAt: new Date()
    });
  }
  
  return ticketId;
}

// Generate a reply for a random active ticket
export async function simulateReply() {
  // Find tickets that are not closed or resolved
  const activeTickets = await db.tickets
    .where('status')
    .anyOf(['open', 'in_progress'])
    .toArray();
    
  if (activeTickets.length === 0) return null;
  
  const ticket = randItem(activeTickets);
  
  // Decide who is replying
  // If the ticket has an assignee, it can be the assignee replying (Support) or the requester replying (User)
  // If the ticket has no assignee, assign it to a technician first
  let senderId;
  let message;
  
  const technicians = await db.users.where('role').equals('technician').toArray();
  const tech = randItem(technicians);
  
  if (!ticket.assigneeId) {
    // Assign ticket first
    ticket.assigneeId = tech.id;
    ticket.status = 'in_progress';
    ticket.updatedAt = new Date();
    await db.tickets.put(ticket);
    
    // Add comment about assignment
    message = `รับงานเข้าระบบแล้วครับ เดี๋ยวผม (${tech.fullName.split(' ')[0]}) จะรีบเข้ามาตรวจเช็คและประสานงานแก้ไขให้ครับ`;
    senderId = tech.id;
    
    // Notify requester
    await db.notifications.add({
      userId: ticket.requesterId,
      message: `ตั๋วของคุณ: "${ticket.title}" ได้รับการมอบหมายให้คุณ ${tech.fullName.split(' ')[0]} ดำเนินการแล้ว`,
      type: 'status_change',
      isRead: 0,
      ticketId: ticket.id,
      createdAt: new Date()
    });
  } else {
    // 50% chance tech replies, 50% chance requester replies
    const isTechRep = Math.random() > 0.5;
    if (isTechRep) {
      senderId = ticket.assigneeId;
      message = randItem(SIM_COMMENT_TEMPLATES_SUPPORT);
      
      // Notify requester
      await db.notifications.add({
        userId: ticket.requesterId,
        message: `มีข้อความใหม่จาก IT Support ในตั๋ว: "${ticket.title}"`,
        type: 'comment',
        isRead: 0,
        ticketId: ticket.id,
        createdAt: new Date()
      });
    } else {
      senderId = ticket.requesterId;
      message = randItem(SIM_COMMENT_TEMPLATES_USER);
      
      // Notify assignee
      await db.notifications.add({
        userId: ticket.assigneeId,
        message: `มีข้อความใหม่จากผู้แจ้งปัญหาในตั๋ว: "${ticket.title}"`,
        type: 'comment',
        isRead: 0,
        ticketId: ticket.id,
        createdAt: new Date()
      });
    }
  }
  
  const comment = {
    ticketId: ticket.id,
    senderId,
    message,
    createdAt: new Date()
  };
  
  await db.comments.add(comment);
  
  // Update ticket timestamp
  ticket.updatedAt = new Date();
  await db.tickets.put(ticket);
  
  return ticket.id;
}

// Global variable to keep interval reference
let simulationInterval = null;

// Start automatic simulator loop
export function startSimulation(onEventTriggered) {
  if (simulationInterval) return;
  
  simulationInterval = setInterval(async () => {
    // 30% chance of new ticket, 70% chance of message reply
    const isNewTicket = Math.random() < 0.3;
    let ticketId;
    let actionType;
    
    if (isNewTicket) {
      ticketId = await simulateNewTicket();
      actionType = 'new_ticket';
    } else {
      ticketId = await simulateReply();
      actionType = 'reply';
    }
    
    if (ticketId && onEventTriggered) {
      onEventTriggered({ actionType, ticketId });
    }
  }, 15000); // Trigger every 15 seconds
}

// Stop automatic simulator loop
export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// Check if simulation is running
export function isSimulationRunning() {
  return simulationInterval !== null;
}
