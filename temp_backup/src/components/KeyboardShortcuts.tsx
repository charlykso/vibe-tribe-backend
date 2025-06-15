import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Command, Search, Plus, Calendar, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
  action?: () => void;
}

interface KeyboardShortcutsProps {
  onNavigate?: (tab: string) => void;
  onCreatePost?: () => void;
  onOpenSearch?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onNavigate,
  onCreatePost,
  onOpenSearch
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    { keys: ['g', 'd'], description: 'Go to Dashboard', category: 'Navigation', action: () => onNavigate?.('dashboard') },
    { keys: ['g', 'c'], description: 'Go to Create Post', category: 'Navigation', action: () => onNavigate?.('post-composer') },
    { keys: ['g', 's'], description: 'Go to Scheduler', category: 'Navigation', action: () => onNavigate?.('scheduler') },
    { keys: ['g', 'i'], description: 'Go to Inbox', category: 'Navigation', action: () => onNavigate?.('inbox') },
    { keys: ['g', 'a'], description: 'Go to Analytics', category: 'Navigation', action: () => onNavigate?.('analytics') },
    { keys: ['g', 'm'], description: 'Go to Media Library', category: 'Navigation', action: () => onNavigate?.('media') },
    { keys: ['g', 'p'], description: 'Go to Platforms', category: 'Navigation', action: () => onNavigate?.('platforms') },
    { keys: ['g', 't'], description: 'Go to Team Chat', category: 'Navigation', action: () => onNavigate?.('team-chat') },
    
    // Actions
    { keys: ['c'], description: 'Create new post', category: 'Actions', action: onCreatePost },
    { keys: ['/', 'Ctrl', 'k'], description: 'Open search', category: 'Actions', action: onOpenSearch },
    { keys: ['Ctrl', 's'], description: 'Save draft', category: 'Actions' },
    { keys: ['Ctrl', 'Enter'], description: 'Publish post', category: 'Actions' },
    { keys: ['Escape'], description: 'Close modal/dialog', category: 'Actions' },
    
    // Team Collaboration
    { keys: ['t', 'a'], description: 'Go to Team Activity', category: 'Team', action: () => onNavigate?.('team-activity') },
    { keys: ['t', 't'], description: 'Go to Task Assignment', category: 'Team', action: () => onNavigate?.('task-assignment') },
    { keys: ['t', 'w'], description: 'Go to Approval Workflows', category: 'Team', action: () => onNavigate?.('approval-workflows') },
    { keys: ['t', 'l'], description: 'Go to Content Library', category: 'Team', action: () => onNavigate?.('content-library') },
    
    // General
    { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General', action: () => setIsOpen(true) },
    { keys: ['Ctrl', ','], description: 'Open settings', category: 'General', action: () => onNavigate?.('settings') },
  ];

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const newPressedKeys = new Set(pressedKeys);
      
      // Add modifier keys
      if (event.ctrlKey) newPressedKeys.add('ctrl');
      if (event.metaKey) newPressedKeys.add('cmd');
      if (event.altKey) newPressedKeys.add('alt');
      if (event.shiftKey) newPressedKeys.add('shift');
      
      // Add the actual key
      newPressedKeys.add(key);
      setPressedKeys(newPressedKeys);

      // Check for shortcuts
      const matchedShortcut = shortcuts.find(shortcut => {
        const shortcutKeys = shortcut.keys.map(k => k.toLowerCase());
        return shortcutKeys.length === newPressedKeys.size &&
               shortcutKeys.every(k => newPressedKeys.has(k));
      });

      if (matchedShortcut) {
        event.preventDefault();
        matchedShortcut.action?.();
        
        toast({
          title: "Shortcut activated",
          description: matchedShortcut.description,
          duration: 2000,
        });
      }
    };

    const handleKeyUp = () => {
      setPressedKeys(new Set());
    };

    // Don't attach shortcuts if a modal is open or user is typing in an input
    const isTyping = document.activeElement?.tagName === 'INPUT' || 
                    document.activeElement?.tagName === 'TEXTAREA' ||
                    document.activeElement?.contentEditable === 'true';

    if (!isTyping) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKeys, shortcuts, onNavigate, onCreatePost, onOpenSearch]);

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl': return '⌃';
        case 'cmd': return '⌘';
        case 'alt': return '⌥';
        case 'shift': return '⇧';
        case 'enter': return '↵';
        case 'escape': return 'Esc';
        case '/': return '/';
        case '?': return '?';
        default: return key.toUpperCase();
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navigation': return <Command className="w-4 h-4" />;
      case 'Actions': return <Plus className="w-4 h-4" />;
      case 'Team': return <MessageSquare className="w-4 h-4" />;
      case 'General': return <Settings className="w-4 h-4" />;
      default: return <Keyboard className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Keyboard shortcuts help button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg border"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Keyboard className="w-5 h-5" />
              <span>Keyboard Shortcuts</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Use these keyboard shortcuts to navigate and perform actions quickly.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(category => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {shortcuts
                        .filter(shortcut => shortcut.category === category)
                        .map((shortcut, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center space-x-1">
                              {formatKeys(shortcut.keys).map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-800"
                                  >
                                    {key}
                                  </Badge>
                                  {keyIndex < formatKeys(shortcut.keys).length - 1 && (
                                    <span className="text-gray-400 text-xs">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Pro Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Shortcuts work when you're not typing in text fields</li>
                <li>• Press <Badge variant="outline" className="text-xs mx-1">?</Badge> anytime to see this help</li>
                <li>• Use <Badge variant="outline" className="text-xs mx-1">G</Badge> + letter for quick navigation</li>
                <li>• <Badge variant="outline" className="text-xs mx-1">Ctrl</Badge> + <Badge variant="outline" className="text-xs mx-1">K</Badge> for universal search</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook for using keyboard shortcuts in components
export const useKeyboardShortcuts = (shortcuts: { [key: string]: () => void }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isTyping = document.activeElement?.tagName === 'INPUT' || 
                      document.activeElement?.tagName === 'TEXTAREA' ||
                      document.activeElement?.contentEditable === 'true';

      if (!isTyping && shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
