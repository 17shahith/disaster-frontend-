import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, UserPlus } from 'lucide-react';
import EntityForm from '../../components/common/EntityForm';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { APP_FULL_NAME, ROLE_HOME, ROLES, SELF_REGISTER_ROLE_OPTIONS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/formatters';

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,80}$/;

const FIELDS = [
  { name: 'name', label: 'Full name', required: true, minLength: 2, maxLength: 120, col: 12, autoComplete: 'name' },
  {
    name: 'username',
    label: 'Username',
    required: true,
    col: 6,
    autoComplete: 'username',
    validate: (v) => (USERNAME_RE.test(v) ? null : "3-80 characters: letters, numbers, '.', '_' or '-'"),
  },
  { name: 'phone', label: 'Phone', type: 'tel', col: 6, autoComplete: 'tel' },
  { name: 'email', label: 'Email', type: 'email', required: true, col: 12, autoComplete: 'email' },
  { name: 'role', label: 'Role', type: 'select', options: SELF_REGISTER_ROLE_OPTIONS, required: true, col: 12, help: 'Administrator accounts are created by an administrator.' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    minLength: 8,
    col: 6,
    autoComplete: 'new-password',
    validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v) ? null : 'Use at least one letter and one number'),
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    required: true,
    col: 6,
    autoComplete: 'new-password',
    validate: (v, values) => (v === values.password ? null : 'Passwords do not match'),
  },
];

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;

  const handleSubmit = async ({ confirmPassword, ...values }) => {
    try {
      const created = await register(values);
      toast.success(`Account '${created.username}' created. You can now sign in.`, 'Registration complete');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
      throw err;
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-hero__brand">
          <span className="sidebar__logo">
            <ShieldAlert size={26} />
          </span>
          <strong>DRRC</strong>
        </div>
        <div>
          <h1>{APP_FULL_NAME}</h1>
          <p>Request access to the control room. Your role decides which modules you can use; every action is logged.</p>
        </div>
        <small>Authorised emergency personnel only. All actions are logged.</small>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <h2 className="d-flex align-items-center gap-2">
            <UserPlus size={22} /> Create account
          </h2>
          <p className="text-muted">Fields marked * are required.</p>
          <EntityForm fields={FIELDS} initialValues={{ role: ROLES.OPERATOR }} onSubmit={handleSubmit} submitLabel="Create account" />
          <p className="text-center small text-muted mt-3 mb-0">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
