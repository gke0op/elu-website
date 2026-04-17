import { useState, useEffect } from 'react';

const CONTRACT_ADDRESS = "0x2553ad2bf2111915dd55f264360b69d5460b60a0";
const BSCSCAN_LINK = `https://bscscan.com/token/${CONTRACT_ADDRESS}`;
const WHITEPAPER_LINK = "/ELU_Whitepaper_v1.25.pdf";

export default function ELUIntroduction({ onComplete }) {
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const slides = [
    {
      id: 0,
      title: "Earth Love United",
      subtitle: "THE DECENTRALIZED ACADEMY",
      icon: "🌍",
      content: (
        <>
          <p>Since 2022, the <strong>$ELU token</strong> has been the backbone of a vision: to decentralize and incentivize the research of climate-saving technologies.</p>
          <p>We are building an ecosystem where AI meets human wisdom to grade the technologies that will save our planet.</p>
        </>
      ),
      color: "#22c55e",
    },
    {
      id: 1,
      title: "The Problem",
      subtitle: "CENTRALIZED DATA",
      icon: "⚠️",
      content: (
        <>
          <p>Today, climate technology assessment is <strong>broken</strong>.</p>
          <ul>
            <li><strong>Centralized</strong>: Reliant on small groups of experts.</li>
            <li><strong>Opaque</strong>: Scoring methodologies hidden behind paywalls.</li>
            <li><strong>Unrewarded</strong>: Researchers contribute knowledge without compensation.</li>
          </ul>
        </>
      ),
      color: "#ef4444",
    },
    {
      id: 2,
      title: "The Solution",
      subtitle: "COMMUNITY-OWNED RESEARCH",
      icon: "💡",
      content: (
        <>
          <p>The <strong>ELU Decentralized Academy</strong> is a trusted network where anyone can submit technology assessments.</p>
          <p>Using our proprietary <strong>P·E·C System</strong> (Potential × Existence × Climate), we generate a verifiable combined metric (CMP) to rank and track every green technology on earth.</p>
        </>
      ),
      color: "#3b82f6",
    },
    {
      id: 3,
      title: "The Utility",
      subtitle: "$ELU MINING & VALIDATION",
      icon: "💎",
      content: (
        <>
          <p>Every quality research submission forms an immutable <strong>NFT Card</strong>.</p>
          <p>Contributors earn $ELU tokens. Validators stake to keep the data clean. Your minted cards hold <strong>Mining Power</strong> that yields passive rewards over time.</p>
          <div className="elu-resources">
            <a href={BSCSCAN_LINK} target="_blank" rel="noopener noreferrer" className="elu-btn-outline">
              bsc: 0x2553...60a0
            </a>
            <a href={WHITEPAPER_LINK} target="_blank" rel="noopener noreferrer" className="elu-btn-outline">
              📄 Read Whitepaper
            </a>
          </div>
        </>
      ),
      color: "#a855f7",
    },
    {
      id: 4,
      title: "Enter the Engine",
      subtitle: "PEC NETWORK v2.0",
      icon: "🚀",
      content: (
        <>
          <p>Are you ready to document the future?</p>
          <p>Access the engine, grade your first technology using AI or Manual mode, and join the Academy.</p>
        </>
      ),
      color: "#10b981",
    }
  ];

  const currentSlide = slides[slide];

  // Navigation handlers
  const nextSlide = () => {
    if (slide < slides.length - 1) setSlide(slide + 1);
  };
  const prevSlide = () => {
    if (slide > 0) setSlide(slide - 1);
  };

  return (
    <div className={`elu-intro-container ${mounted ? 'mounted' : ''}`}>
      {/* Dynamic Background */}
      <div 
        className="elu-intro-bg" 
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${currentSlide.color}15 0%, #08080c 60%)` 
        }} 
      />

      <div className="elu-glass-panel">
        <div className="elu-slide-progress">
          {slides.map((s) => (
            <div 
              key={s.id} 
              className={`elu-progress-dot ${s.id === slide ? 'active' : ''} ${s.id < slide ? 'completed' : ''}`}
              style={{ backgroundColor: s.id <= slide ? currentSlide.color : '#ffffff15' }}
            />
          ))}
        </div>

        <div className="elu-slide-content">
          <div className="elu-slide-icon" style={{ textShadow: `0 0 20px ${currentSlide.color}88` }}>
            {currentSlide.icon}
          </div>
          
          <div className="elu-slide-header">
            <h4 style={{ color: currentSlide.color }}>{currentSlide.subtitle}</h4>
            <h2>{currentSlide.title}</h2>
          </div>

          <div className="elu-slide-body">
            {currentSlide.content}
          </div>
        </div>

        <div className="elu-slide-actions">
          {slide > 0 ? (
            <button onClick={prevSlide} className="elu-btn-secondary">
              ← PREV
            </button>
          ) : (
             <div style={{ width: '80px' }} /> // Placeholder for layout
          )}
          
          {slide < slides.length - 1 ? (
            <button 
              onClick={nextSlide} 
              className="elu-btn-primary" 
              style={{ background: currentSlide.color, boxShadow: `0 0 15px ${currentSlide.color}44` }}
            >
              NEXT →
            </button>
          ) : (
            <button 
              onClick={onComplete} 
              className="elu-btn-primary elu-btn-launch"
            >
              INITIALIZE PEC ENGINE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
