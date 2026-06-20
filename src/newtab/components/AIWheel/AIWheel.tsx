import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import { DEFAULT_AI_TOOLS } from '../../../shared/defaults';
import type { AITool, AppSettings } from '../../../shared/types';
import styles from './AIWheel.module.css';

export default function AIWheel() {
  const [tools, setTools] = useStorage<AITool[]>(KEYS.AI_TOOLS, DEFAULT_AI_TOOLS);
  const [settings] = useStorage<AppSettings>(KEYS.SETTINGS, { edgeActivation: true } as AppSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<AITool | null>(null);

  const hoverTimeoutRef = useRef<number | undefined>(undefined);
  const leaveTimeoutRef = useRef<number | undefined>(undefined);

  // Filter pinned/active tools and sort by order
  const activeTools = tools
    .filter((t) => t.pinned !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Alt+Space (or custom shortcut if configured)
      const isAltSpace = e.altKey && e.code === 'Space';
      if (isAltSpace) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Left-edge hover activation
  const handleMouseEnterEdge = () => {
    if (!settings.edgeActivation) return;
    clearTimeout(leaveTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, 150); // slight delay to avoid accidental triggers
  };

  const handleMouseLeaveEdge = () => {
    clearTimeout(hoverTimeoutRef.current);
  };

  const handleMouseLeaveWheel = () => {
    // 500ms grace period before fade-out on mouse leave
    leaveTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setHoveredNode(null);
    }, 500);
  };

  const handleMouseEnterWheel = () => {
    clearTimeout(leaveTimeoutRef.current);
  };

  // Node navigation click handlers
  const handleNodeClick = (tool: AITool, e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage({
        type: 'OPEN_TAB',
        url: tool.url,
        active: true
      });
    } else {
      window.open(tool.url, '_blank');
    }
  };

  const handleNodeAuxClick = (tool: AITool, e: React.MouseEvent) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'OPEN_TAB',
          url: tool.url,
          active: false
        });
      } else {
        window.open(tool.url, '_blank');
      }
    }
  };

  const handleNodeContextMenu = (tool: AITool, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingNode(tool);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;
    const updated = tools.map((t) => (t.id === editingNode.id ? editingNode : t));
    setTools(updated);
    setEditingNode(null);
  };

  const handleRemoveNode = () => {
    if (!editingNode) return;
    const updated = tools.map((t) => (t.id === editingNode.id ? { ...t, pinned: false } : t));
    setTools(updated);
    setEditingNode(null);
  };

  return (
    <>
      {/* Invisible hover trigger zone on the left edge */}
      <div
        className={styles.edgeTrigger}
        onMouseEnter={handleMouseEnterEdge}
        onMouseLeave={handleMouseLeaveEdge}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className={styles.wheelContainer}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={handleMouseEnterWheel}
              onMouseLeave={handleMouseLeaveWheel}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              {/* Radial semicircular arrangement */}
              <div className={styles.wheelOrigin}>
                {activeTools.map((tool, index) => {
                  const count = activeTools.length;
                  // Distribute nodes over 180 degrees (from -90deg to +90deg relative to vertical)
                  const startAngle = -90;
                  const endAngle = 90;
                  const step = count > 1 ? (endAngle - startAngle) / (count - 1) : 0;
                  const angleDeg = startAngle + index * step;
                  const angleRad = (angleDeg * Math.PI) / 180;

                  // Radius of the circle (180px)
                  const radius = 180;
                  const x = radius * Math.cos(angleRad);
                  const y = radius * Math.sin(angleRad);

                  return (
                    <div
                      key={tool.id}
                      className={styles.nodeWrapper}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    >
                      <a
                        href={tool.url}
                        className={`${styles.node} ${hoveredNode === tool.id ? styles.hovered : ''}`}
                        onClick={(e) => handleNodeClick(tool, e)}
                        onAuxClick={(e) => handleNodeAuxClick(tool, e)}
                        onContextMenu={(e) => handleNodeContextMenu(tool, e)}
                        onMouseEnter={() => setHoveredNode(tool.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <span
                          className={styles.iconWrapper}
                          dangerouslySetInnerHTML={{ __html: tool.icon }}
                        />
                      </a>

                      {/* Floating name label shown on hover */}
                      <AnimatePresence>
                        {hoveredNode === tool.id && (
                          <motion.div
                            className={styles.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                          >
                            {tool.name}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Center text tag */}
                <div className={styles.centerNode}>
                  <div className={styles.centerLabel}>AI</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline edit modal */}
      <AnimatePresence>
        {editingNode && (
          <div className={styles.modalOverlay} onClick={() => setEditingNode(null)}>
            <motion.form
              className="glass-card"
              style={{ padding: '24px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1000 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveEdit}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Edit AI Node
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>NAME</label>
                <input
                  type="text"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>URL</label>
                <input
                  type="url"
                  value={editingNode.url}
                  onChange={(e) => setEditingNode({ ...editingNode, url: e.target.value })}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px',
                    color: 'var(--text-primary)'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'var(--accent)',
                    color: '#000000',
                    border: 'none',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleRemoveNode}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
