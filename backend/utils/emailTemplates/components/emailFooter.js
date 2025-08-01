/**
 * Email Footer Component with Abstract Background and Social Media Links
 * Uses the light abstract background with social media links overlay
 */

const createEmailFooter = () => {
  return `
    <div style="
      background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 50%, #14b8a6 100%);
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDYwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZmVmN2VkIi8+CjxwYXRoIGQ9Ik0wIDBoODBjNDQgMCA4MCAzNiA4MCA4MHY3MEgwVjB6IiBmaWxsPSIjZjk3MzE2Ii8+CjxwYXRoIGQ9Ik02MDAgMTUwSDUyMGMtNDQgMC04MC0zNi04MC04MFYwaDE2MHYxNTB6IiBmaWxsPSIjMTRiOGE2Ii8+CjxwYXRoIGQ9Ik0yMCAxNTBoMTAwYzQ0IDAgODAtMzYgODAtODBWMjBIMjB2MTMweiIgZmlsbD0iI2ZiYmYyNCIgZmlsbC1vcGFjaXR5PSIwLjYiLz4KPHA+YXRoIGQ9Ik01ODAgMEg0ODBjLTQ0IDAtODAgMzYtODAgODB2NzBoMTgwVjB6IiBmaWxsPSIjZmJiZjI0IiBmaWxsLW9wYWNpdHk9IjAuNCIvPgo8L3N2Zz4=');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      padding: 30px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
      margin-top: 30px;
    ">
      <!-- Abstract shapes overlay -->
      <div style="
        position: absolute;
        top: -15px;
        left: 30px;
        width: 60px;
        height: 60px;
        background: rgba(249, 115, 22, 0.3);
        border-radius: 60% 40% 50% 70%;
        transform: rotate(30deg);
      "></div>
      
      <div style="
        position: absolute;
        bottom: -20px;
        right: 50px;
        width: 80px;
        height: 80px;
        background: rgba(20, 184, 166, 0.4);
        border-radius: 40% 60% 70% 30%;
        transform: rotate(-45deg);
      "></div>
      
      <div style="
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: rgba(251, 191, 36, 0.5);
        border-radius: 50%;
      "></div>
      
      <!-- Content -->
      <div style="position: relative; z-index: 10;">
        <!-- Social Media Links -->
        <div style="margin-bottom: 20px;">
          <h3 style="
            color: #374151;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 15px 0;
          ">
            Follow Us on Social Media
          </h3>
          
          <div style="
            display: inline-flex;
            gap: 15px;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
          ">
            <!-- TikTok Icon -->
            <a href="https://www.tiktok.com/@_quluub" style="
              display: inline-block;
              width: 50px;
              height: 50px;
              background: #000000;
              border-radius: 50%;
              text-decoration: none;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              transition: transform 0.3s ease;
              position: relative;
            " title="Follow us on TikTok">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 24px;
                font-weight: bold;
              ">♪</div>
            </a>
            
            <!-- Facebook Icon -->
            <a href="https://www.facebook.com/Quluubplatform" style="
              display: inline-block;
              width: 50px;
              height: 50px;
              background: #1877F2;
              border-radius: 50%;
              text-decoration: none;
              box-shadow: 0 4px 15px rgba(24,119,242,0.3);
              transition: transform 0.3s ease;
              position: relative;
            " title="Follow us on Facebook">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 24px;
                font-weight: bold;
              ">f</div>
            </a>
            
            <!-- YouTube Icon -->
            <a href="https://youtube.com/@quluubplatform" style="
              display: inline-block;
              width: 50px;
              height: 50px;
              background: #FF0000;
              border-radius: 50%;
              text-decoration: none;
              box-shadow: 0 4px 15px rgba(255,0,0,0.3);
              transition: transform 0.3s ease;
              position: relative;
            " title="Subscribe to our YouTube">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 20px;
              ">▶</div>
            </a>
            
            <!-- Twitter/X Icon -->
            <a href="https://x.com/_Quluub" style="
              display: inline-block;
              width: 50px;
              height: 50px;
              background: #000000;
              border-radius: 50%;
              text-decoration: none;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              transition: transform 0.3s ease;
              position: relative;
            " title="Follow us on X (Twitter)">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 20px;
                font-weight: bold;
              ">X</div>
            </a>
          </div>
        </div>
        
        <!-- Divider -->
        <div style="
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(156, 163, 175, 0.5), transparent);
          margin: 20px 0;
        "></div>
        
        <!-- Footer Text -->
        <div style="
          background: rgba(255, 255, 255, 0.8);
          border-radius: 15px;
          padding: 15px;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        ">
          <p style="
            color: #6b7280;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            margin: 0 0 5px 0;
            line-height: 1.4;
          ">
            © 2024 Quluub - Connecting Hearts, Building Futures
          </p>
          <p style="
            color: #9ca3af;
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            margin: 0;
            line-height: 1.3;
          ">
            This email was sent to you because you have an account with Quluub.<br>
            If you no longer wish to receive these emails, please contact support@quluub.com
          </p>
        </div>
      </div>
    </div>
  `;
};

module.exports = createEmailFooter;
