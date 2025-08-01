/**
 * Email Header Component with Abstract Background
 * Uses the teal/orange abstract background with subject overlay
 */

const createEmailHeader = (subject = 'Quluub Notification') => {
  return `
    <div style="
      background: linear-gradient(135deg, #14b8a6 0%, #f97316 100%);
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDYwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMTRiOGE2Ii8+CjxwYXRoIGQ9Ik0wIDBoMTEwYzU1IDAgMTAwIDQ1IDEwMCAxMDB2MTAwSDBWMHoiIGZpbGw9IiNmOTczMTYiLz4KPHA+YXRoIGQ9Ik02MDAgMjAwSDQ5MGMtNTUgMC0xMDAtNDUtMTAwLTEwMFYwaDIxMHYyMDB6IiBmaWxsPSIjZmJiZjI0Ii8+CjxwYXRoIGQ9Ik0wIDIwMGgxNDBjNTUgMCAxMDAtNDUgMTAwLTEwMFYwSDBoMjAweiIgZmlsbD0iI2ZiYmYyNCIgZmlsbC1vcGFjaXR5PSIwLjciLz4KPHA+YXRoIGQ9Ik02MDAgMEg0NjBjLTU1IDAtMTAwIDQ1LTEwMCAxMDB2MTAwaDI0MFYweiIgZmlsbD0iI2ZiYmYyNCIgZmlsbC1vcGFjaXR5PSIwLjUiLz4KPC9zdmc+');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      padding: 40px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
    ">
      <!-- Abstract shapes overlay -->
      <div style="
        position: absolute;
        top: -20px;
        left: -20px;
        width: 120px;
        height: 120px;
        background: rgba(251, 191, 36, 0.3);
        border-radius: 50% 30% 70% 40%;
        transform: rotate(45deg);
      "></div>
      
      <div style="
        position: absolute;
        bottom: -30px;
        right: -30px;
        width: 150px;
        height: 150px;
        background: rgba(249, 115, 22, 0.4);
        border-radius: 30% 70% 40% 60%;
        transform: rotate(-30deg);
      "></div>
      
      <div style="
        position: absolute;
        top: 50%;
        left: 20px;
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 40% 60% 30% 70%;
        transform: translateY(-50%) rotate(60deg);
      "></div>
      
      <!-- Content -->
      <div style="position: relative; z-index: 10;">
        <!-- Quluub Logo -->
        <div style="margin-bottom: 20px;">
          <h1 style="
            color: white;
            font-family: 'Arial', sans-serif;
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 1px;
          ">
            💚 Quluub
          </h1>
        </div>
        
        <!-- Subject Line -->
        <div style="
          background: rgba(255, 255, 255, 0.95);
          border-radius: 25px;
          padding: 15px 30px;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
        ">
          <h2 style="
            color: #14b8a6;
            font-family: 'Arial', sans-serif;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            text-align: center;
          ">
            ${subject}
          </h2>
        </div>
      </div>
    </div>
  `;
};

module.exports = createEmailHeader;
