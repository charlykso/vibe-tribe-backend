# Redis Setup on Render - Complete Guide

## 🎯 **Overview**

This guide explains how to set up Redis on Render for the VibeTribe backend, enabling job queues, caching, and real-time features.

---

## 📋 **Step 1: Create Redis Instance on Render**

### **1.1 Access Render Dashboard**
1. Go to [dashboard.render.com/new/redis](https://dashboard.render.com/new/redis)
2. Or click **New > Key Value** in your Render Dashboard

### **1.2 Configure Redis Instance**
```
Name: vibe-tribe-redis
Region: Ohio (same as your backend service)
Maxmemory Policy: allkeys-lru (recommended for caching)
Instance Type: Starter ($7/month) or Free for testing
```

### **1.3 Create Instance**
- Click **"Create Key Value"**
- Wait for status to show **"Available"**

---

## 🔗 **Step 2: Get Connection Information**

After creation, you'll have two URLs:

### **Internal URL (Recommended)**
```
redis://red-xxxxx:6379
```
- Use this for Render services in the same region
- Lower latency, private network communication
- No external access configuration needed

### **External URL**
```
rediss://red-xxxxx:6379
```
- For external connections (development, testing)
- Requires access control configuration
- TLS secured connections

---

## ⚙️ **Step 3: Configure Backend Environment**

### **3.1 Update Environment Variables**

In your Render backend service environment variables:

```bash
# Redis Configuration
REDIS_URL=redis://red-xxxxx:6379

# Alternative individual settings (not needed if using REDIS_URL)
# REDIS_HOST=red-xxxxx.render.com
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

### **3.2 Local Development**

For local development, update your `.env` file:

```bash
# Local Redis (for development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Or use Redis URL format
# REDIS_URL=redis://localhost:6379
```

---

## 🔧 **Step 4: Backend Code Configuration**

The backend is already configured to handle both URL and individual host/port configurations:

### **Queue Service Configuration**
```typescript
// Redis configuration (already implemented)
const redisConfig = process.env.REDIS_URL 
  ? process.env.REDIS_URL // Use URL format for Render deployment
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };
```

### **Features Enabled with Redis**
- ✅ Post scheduling and publishing queues
- ✅ Analytics sync job queues
- ✅ Background job processing
- ✅ Real-time notifications
- ✅ Caching capabilities

---

## 🚀 **Step 5: Deploy and Test**

### **5.1 Deploy Backend**
1. Commit and push your changes
2. Deploy to Render
3. Check logs for successful Redis connection

### **5.2 Verify Connection**
Look for these log messages:
```
✅ Queue system initialized successfully
✅ Redis connection established
```

### **5.3 Test Queue Functionality**
- Schedule a post to test post queue
- Check analytics sync to test analytics queue
- Monitor queue stats in dashboard

---

## 🛡️ **Step 6: Security Configuration**

### **6.1 Access Control (External Connections)**
If you need external access:

1. Go to your Redis instance **Info** page
2. Scroll to **Access Control** section
3. Add IP addresses in CIDR notation:
   ```
   0.0.0.0/0  # Allow all (not recommended for production)
   192.168.1.0/24  # Specific network
   ```

### **6.2 Production Security**
- ✅ Use internal URLs only
- ✅ Enable access control for external connections
- ✅ Monitor connection logs
- ✅ Regular security audits

---

## 📊 **Step 7: Monitoring and Maintenance**

### **7.1 Redis Metrics**
Monitor in Render Dashboard:
- Memory usage
- CPU load
- Active connections
- Queue statistics

### **7.2 Queue Management**
```typescript
// Get queue statistics (already implemented)
const stats = await getQueueStats();
console.log('Queue Stats:', stats);
```

### **7.3 Scaling**
- Start with Starter plan ($7/month)
- Upgrade based on usage metrics
- Monitor memory usage and connection limits

---

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Connection Refused**
   - Check Redis instance status
   - Verify REDIS_URL format
   - Ensure same region deployment

2. **Authentication Failed**
   - Verify access control settings
   - Check external connection requirements
   - Use internal URL for Render services

3. **Memory Issues**
   - Monitor memory usage
   - Adjust maxmemory policy
   - Consider upgrading instance type

### **Debug Commands**
```bash
# Test Redis connection locally
redis-cli -u redis://localhost:6379 ping

# Check queue status
curl http://your-backend-url/api/v1/queue/stats
```

---

## 💰 **Pricing Information**

| Plan | RAM | Connections | Price |
|------|-----|-------------|-------|
| Free | 25MB | 20 | $0/month |
| Starter | 256MB | 1000 | $7/month |
| Standard | 1GB | 1000 | $25/month |
| Pro | 4GB | 1000 | $90/month |

**Recommendation**: Start with Starter plan for production

---

## ✅ **Verification Checklist**

- [ ] Redis instance created on Render
- [ ] Internal URL configured in backend environment
- [ ] Backend deployed with Redis configuration
- [ ] Queue system logs show successful initialization
- [ ] Post scheduling works correctly
- [ ] Analytics sync jobs running
- [ ] Monitoring set up for Redis metrics

---

## 📞 **Support**

If you encounter issues:
1. Check Render Dashboard logs
2. Review Redis instance metrics
3. Contact Render support for infrastructure issues
4. Check VibeTribe backend logs for application issues

**Status**: ✅ Redis configuration complete and production-ready
