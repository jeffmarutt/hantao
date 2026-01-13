# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# คัดลอกเฉพาะไฟล์ package เพื่อติดตั้ง library ก่อน (ช่วยให้ build เร็วขึ้น)
COPY package*.json ./

# ติดตั้ง dependencies (ใช้ --legacy-peer-deps เพื่อลดปัญหาเวอร์ชันขัดแย้ง)
RUN npm install --no-audit --no-fund --legacy-peer-deps

# คัดลอกโค้ดทั้งหมด (รวมถึง index.html และไฟล์ที่อยู่ด้านนอก)
COPY . .

# --- ส่วนสำคัญที่สุด: ดึงค่า API Key จาก Easypanel มาใส่ในตัวแปร Vite ---
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# สั่ง Build โปรเจกต์ (Vite จะฝัง Key ลงไปในขั้นตอนนี้)
RUN npm run build

# Stage 2: Production stage (ใช้ Nginx)
FROM nginx:1.27-alpine

# คัดลอกไฟล์ที่ build เสร็จแล้วจากโฟลเดอร์ dist ไปยัง nginx
COPY --from=build /app/dist /usr/share/nginx/html

# คัดลอกไฟล์ตั้งค่า Nginx (ตรวจสอบว่าคุณมีไฟล์ nginx.conf ใน GitHub ด้วยนะครับ)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
