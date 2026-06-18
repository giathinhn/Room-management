/**
 * Badge component — compact colored label.
 *
 * Props:
 *   text    {string}  Label text
 *   variant {'info'|'success'|'warning'|'error'|'default'}
 */
function Badge({ text, variant = 'default' }) {
  return (
    <span className={`badge badge--${variant}`}>
      {text}
    </span>
  );
}

export default Badge;
