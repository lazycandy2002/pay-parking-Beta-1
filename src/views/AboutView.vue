<template>
  <div class="about-container">
    <div class="about-content">
      <div class="logo-container">
        <img src="../assets/J&W Logo.png" alt="J&W PayParking Logo" class="company-logo" />
      </div>
      
      <h1 class="about-title">About J&W PayParking</h1>
      
      <div class="about-description">
        <p>
          Founded in 2020, J&W PayParking is dedicated to revolutionizing parking management 
          with innovative solutions that enhance efficiency and user experience.
        </p>
        
        <p>
          Our state-of-the-art parking management system provides comprehensive solutions for:
        </p>
        
        <div class="features">
          <div class="feature-item">
            <Icon type="ios-checkmark-circle" size="24" color="#4CAF50" />
            <span>Real-time parking slot monitoring</span>
          </div>
          <div class="feature-item">
            <Icon type="ios-checkmark-circle" size="24" color="#4CAF50" />
            <span>Automated payment processing</span>
          </div>
          <div class="feature-item">
            <Icon type="ios-checkmark-circle" size="24" color="#4CAF50" />
            <span>Detailed reporting and analytics</span>
          </div>
          <div class="feature-item">
            <Icon type="ios-checkmark-circle" size="24" color="#4CAF50" />
            <span>User-friendly management interface</span>
          </div>
        </div>
        
        <h2 class="section-title">Our Mission</h2>
        <p>
          To provide efficient, reliable, and user-friendly parking solutions that optimize 
          space utilization and enhance the parking experience for both operators and users.
        </p>
        
        <h2 class="section-title">Contact Information</h2>
        <div class="contact-info">
          <div class="contact-item">
            <Icon type="ios-mail" size="20" />
            <span>info@jwpayparking.com</span>
          </div>
          <div class="contact-item">
            <Icon type="ios-call" size="20" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div class="contact-item">
            <Icon type="ios-pin" size="20" />
            <span>123 Parking Avenue, Suite 456, Metro City</span>
          </div>
        </div>
        
        <div class="version-info">
          <p>Version 1.2.0 | © 2025 J&W PayParking. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutView'
}
</script>

<style scoped>
.about-container {
  min-height: 100%;
  padding: 2rem;
  background-color: #f8f9fa;
}

.about-content {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.company-logo {
  max-width: 180px;
  height: auto;
}

.about-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.about-description p {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: #4a4a4a;
}

.section-title {
  color: #2c3e50;
  margin: 2rem 0 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.feature-item span {
  font-size: 1rem;
}

.contact-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  margin: 1.5rem 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.version-info {
  text-align: center;
  margin-top: 2rem;
  color: #999;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .about-content {
    padding: 1.5rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}
</style>