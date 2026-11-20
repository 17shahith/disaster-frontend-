import { Link } from 'react-router-dom';
import { Compass, Lock } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

export function UnauthorizedPage() {
  return (
    <div className="page">
      <div className="card-panel">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          message="Your role does not have permission to open this module. Contact an administrator if you need access."
          action={
            <Link to="/dashboard" className="btn btn-primary mt-2">
              Back to dashboard
            </Link>
          }
        />
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="card-panel">
        <EmptyState
          icon={Compass}
          title="Page not found"
          message="The page you requested does not exist."
          action={
            <Link to="/dashboard" className="btn btn-primary mt-2">
              Back to dashboard
            </Link>
          }
        />
      </div>
    </div>
  );
}
