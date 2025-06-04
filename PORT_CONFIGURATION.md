# VibeTribe Port Configuration

## 🎯 **Standardized Port Setup**

To ensure consistent development experience and avoid port conflicts, VibeTribe now uses **standardized ports**:

### **📍 Port Assignments**

| Service          | Port   | URL                     | Description                                             |
| ---------------- | ------ | ----------------------- | ------------------------------------------------------- |
| **Backend API**  | `3001` | `http://localhost:3001` | Main backend server with authentication & API endpoints |
| **Frontend Dev** | `8081` | `http://localhost:8081` | Vite development server (auto-assigned if 8080 busy)    |
| **WebSocket**    | `3001` | `ws://localhost:3001`   | Real-time communication (same as backend)               |

### **🚀 Quick Start Commands**

```bash
# Start backend (with automatic port conflict resolution)
npm run backend

# Start frontend
npm run dev

# Start both simultaneously
npm run dev:full
```

### **🔧 Backend Port Management**

The backend now includes **intelligent port management**:

#### **Automatic Port Conflict Resolution**

- ✅ **Detects** if port 3001 is in use
- ✅ **Identifies** conflicting processes
- ✅ **Terminates** conflicting processes automatically
- ✅ **Starts** backend on clean port 3001

#### **Available Scripts**

```bash
# Smart backend startup (recommended)
npm run backend

# Direct backend startup (no conflict resolution)
npm run backend:simple

# Full development environment
npm run dev:full
```

### **⚙️ Environment Configuration**

#### **Frontend (.env and .env.local)**

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
```

**⚠️ Important**: Check both `.env` and `.env.local` files. Vite prioritizes `.env.local` over `.env`!

#### **Backend (.env)**

```env
PORT=3001
```

### **🔍 Health Checks**

#### **Backend Health Check**

```bash
curl http://localhost:3001/api/v1/health
```

#### **Expected Response**

```json
{
  "status": "ok",
  "message": "Simple backend is running"
}
```

### **🛠️ Troubleshooting**

#### **Port 3001 Still Busy?**

```bash
# Manual process termination
npx kill-port 3001

# Or find and kill manually
netstat -ano | findstr :3001
taskkill //F //PID <PID_NUMBER>
```

#### **Frontend Can't Connect?**

1. ✅ Verify backend is running: `curl http://localhost:3001/api/v1/health`
2. ✅ Check **both** `.env` and `.env.local` files have correct `VITE_API_URL=http://localhost:3001/api/v1`
3. ✅ Delete `.env.local` if it has wrong port (Vite prioritizes `.env.local` over `.env`)
4. ✅ Restart frontend: `npm run dev`

#### **CORS Issues?**

Backend is configured to allow both:

- `http://localhost:8080` (default Vite port)
- `http://localhost:8081` (fallback Vite port)

### **📝 Demo User Credentials**

The backend displays available demo users on startup:

```
📝 Available demo users:
   - admin@vibetrybe.com / admin123 (admin)
   - user@vibetrybe.com / user123 (member)
   - test@example.com / password123 (member)
   - charlykso121@gmail.com / NEXsolve869#$ (admin)
```

### **🎉 Benefits**

✅ **Consistent Development**: Same ports every time  
✅ **No Manual Port Management**: Automatic conflict resolution  
✅ **Clear Documentation**: Always know which service runs where  
✅ **Easy Debugging**: Predictable URLs for testing  
✅ **Team Collaboration**: Everyone uses same configuration

### **🔄 Migration from Old Setup**

If you were using different ports before:

1. **Update your bookmarks** to use `http://localhost:3001` for API
2. **Clear browser cache** to avoid old API calls
3. **Restart both services** using the new npm scripts
4. **Update any external tools** (Postman, etc.) to use port 3001

---

**🎯 Now you can focus on development instead of port management!**
