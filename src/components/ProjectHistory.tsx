// src/components/ProjectHistory.tsx - USER'S SAVED PROJECTS LIST
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
    FolderOpen,
    Calendar,
    FileCode,
    Trash2,
    ExternalLink,
    Loader2,
    Package
} from 'lucide-react';

interface Project {
    id: string;
    name: string;
    createdAt: string;
    lastModified: string;
    files: { name: string; content: string }[];
    firstPrompt?: string;
}

interface ProjectHistoryProps {
    maxItems?: number;
    showTitle?: boolean;
}

export default function ProjectHistory({ maxItems, showTitle = true }: ProjectHistoryProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

      const hydrate = async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.uid)
          .order('last_modified', { ascending: false });

        if (error) {
          console.error('Error loading projects:', error);
          setLoading(false);
          return;
        }

        const projectList: Project[] = (data || []).map((row) => ({
          id: row.id,
          name: row.name || 'Untitled Project',
          createdAt: row.created_at || new Date().toISOString(),
          lastModified: row.last_modified || row.created_at || new Date().toISOString(),
          files: Array.isArray(row.files) ? row.files : [],
          firstPrompt: row.first_prompt || undefined
        }));

        setProjects(maxItems ? projectList.slice(0, maxItems) : projectList);
        setLoading(false);
      };

      void hydrate();

      const channel = supabase
        .channel(`projects-${user.uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${user.uid}`
          },
          () => {
            void hydrate();
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }, [user, maxItems]);

    const handleOpenProject = (project: Project) => {
        navigate(`/builder?project=${project.id}`);
    };

    const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !confirm('Delete this project? This cannot be undone.')) return;

        setDeleting(projectId);
        try {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', user.uid);

          if (error) throw error;
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    if (loading) {
        return (
            <div className="projects-loading">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading projects...</span>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="projects-empty">
                <Package className="w-12 h-12" />
                <h4>No projects yet</h4>
                <p>Start building to see your projects here</p>
            </div>
        );
    }

    return (
        <div className="project-history">
            {showTitle && (
                <div className="history-header">
                    <h3>
                        <FolderOpen className="w-5 h-5" />
                        My Projects
                    </h3>
                    {maxItems && projects.length >= maxItems && (
                        <button onClick={() => navigate('/dashboard#projects')} className="view-all-btn">
                            View all
                        </button>
                    )}
                </div>
            )}

            <div className="projects-list">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className="project-card"
                        onClick={() => handleOpenProject(project)}
                    >
                        <div className="project-icon">
                            <FileCode className="w-5 h-5" />
                        </div>

                        <div className="project-info">
                            <h4>{project.name}</h4>
                            <div className="project-meta">
                                <span className="meta-item">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(project.lastModified)}
                                </span>
                                <span className="meta-item">
                                    <FileCode className="w-3 h-3" />
                                    {project.files.length} files
                                </span>
                            </div>
                        </div>

                        <div className="project-actions">
                            <button
                                className="action-btn open"
                                onClick={(e) => { e.stopPropagation(); handleOpenProject(project); }}
                                title="Open in Builder"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                                className="action-btn delete"
                                onClick={(e) => handleDeleteProject(project.id, e)}
                                disabled={deleting === project.id}
                                title="Delete project"
                            >
                                {deleting === project.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .project-history {
          width: 100%;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .history-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          margin: 0;
        }

        .history-header h3 svg {
          color: #f97316;
        }

        .view-all-btn {
          font-size: 14px;
          font-weight: 600;
          color: #f97316;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .view-all-btn:hover {
          text-decoration: underline;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .project-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          border: 1.5px solid #e4e4e7;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .project-card:hover {
          border-color: #f97316;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .project-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border-radius: 10px;
          color: #f97316;
          flex-shrink: 0;
        }

        .project-info {
          flex: 1;
          min-width: 0;
        }

        .project-info h4 {
          font-size: 15px;
          font-weight: 600;
          color: #18181b;
          margin: 0 0 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #71717a;
        }

        .meta-item svg {
          color: #a1a1aa;
        }

        .project-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f4f5;
          border: none;
          border-radius: 8px;
          color: #52525b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #e4e4e7;
        }

        .action-btn.open:hover {
          background: #fff7ed;
          color: #f97316;
        }

        .action-btn.delete:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .projects-loading,
        .projects-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          color: #71717a;
        }

        .projects-loading svg,
        .projects-empty svg {
          margin-bottom: 16px;
          color: #a1a1aa;
        }

        .projects-empty h4 {
          font-size: 16px;
          font-weight: 600;
          color: #52525b;
          margin: 0 0 6px 0;
        }

        .projects-empty p {
          font-size: 14px;
          margin: 0;
        }
      `}</style>
        </div>
    );
}
