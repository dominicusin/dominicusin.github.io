---
layout: default
title: Subscribe
permalink: /subscribe/
---

<div class="subscribe-page">
  <div class="subscribe-hero">
    <h1 class="subscribe-title">Stay Connected</h1>
    <p class="subscribe-subtitle">
      Get the latest engineering insights delivered to your inbox
    </p>
  </div>
  
  <div class="subscribe-content">
    <div class="subscription-container">
      <!-- Email subscription content will be rendered here by JS -->
    </div>
    
    <div class="subscribe-benefits">
      <h2>Why Subscribe?</h2>
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-icon">📧</div>
          <h3>Weekly Digest</h3>
          <p>Curated highlights of the best engineering content</p>
        </div>
        
        <div class="benefit-card">
          <div class="benefit-icon">🚀</div>
          <h3>Early Access</h3>
          <p>Be the first to read new articles and insights</p>
        </div>
        
        <div class="benefit-card">
          <div class="benefit-icon">🎯</div>
          <h3>Expert Content</h3>
          <p>In-depth analysis from industry professionals</p>
        </div>
        
        <div class="benefit-card">
          <div class="benefit-icon">📊</div>
          <h3>Data-Driven</h3>
          <p>Practical insights backed by research and data</p>
        </div>
      </div>
    </div>
    
    <div class="rss-alternative">
      <h2>Prefer RSS?</h2>
      <div class="rss-info">
        <p>
          Get real-time updates in your favorite RSS reader without sharing your email address.
        </p>
        <div class="rss-actions">
          <a href="/feed.xml" class="rss-link" target="_blank">
            <span class="rss-icon">📡</span>
            <span>Subscribe via RSS</span>
          </a>
          <button class="copy-rss-btn" onclick="copyRSS()">
            <span class="copy-icon">📋</span>
            <span>Copy RSS URL</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="privacy-info">
      <h2>Privacy & Security</h2>
      <div class="privacy-content">
        <div class="privacy-points">
          <div class="privacy-point">
            <h3>🔒 Secure</h3>
            <p>Your email is encrypted and stored securely</p>
          </div>
          
          <div class="privacy-point">
            <h3>👤 Private</h3>
            <p>We never share your email with third parties</p>
          </div>
          
          <div class="privacy-point">
            <h3>✅ Verified</h3>
            <p>Double opt-in ensures you control your subscription</p>
          </div>
          
          <div class="privacy-point">
            <h3>🚪 Easy Exit</h3>
            <p>Unsubscribe anytime with one click</p>
          </div>
        </div>
        
        <div class="privacy-gdpr">
          <h3>GDPR Compliant</h3>
          <p>
            We respect your privacy rights. You can request data deletion, 
            access, or modification at any time. See our 
            <a href="/privacy">Privacy Policy</a> for details.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
function copyRSS() {
  const rssUrl = window.location.origin + '/feed.xml';
  navigator.clipboard.writeText(rssUrl).then(() => {
    const btn = event.target.closest('.copy-rss-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="copy-icon">✅</span><span>Copied!</span>';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy RSS URL:', err);
  });
}
</script>