import { useState } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import './DateRangeFilter.css';

const PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '3 tháng', months: 3 },
  { label: 'Tất cả', all: true },
];

/**
 * DateRangeFilter — quick preset buttons + custom date pickers.
 *
 * Props:
 *   onChange({ startDate, endDate })  — called when range changes
 */
const DateRangeFilter = ({ onChange }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [activePreset, setActivePreset] = useState(0);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const applyPreset = (index) => {
    const preset = PRESETS[index];
    setActivePreset(index);
    setCustomStart('');
    setCustomEnd('');

    let start, end;
    if (preset.all) {
      start = new Date('2020-01-01');
      end = new Date('2099-12-31');
    } else {
      end = new Date();
      if (preset.months) {
        start = subMonths(end, preset.months);
      } else {
        start = subDays(end, preset.days - 1);
      }
    }

    onChange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    });
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    if (customEnd < customStart) return;
    setActivePreset(-1);
    onChange({ startDate: customStart, endDate: customEnd });
  };

  return (
    <div className="date-range-filter" role="group" aria-label="Lọc theo khoảng thời gian">
      <div className="date-range-filter__presets">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            id={`drf-preset-${i}`}
            className={`date-range-filter__btn${activePreset === i ? ' active' : ''}`}
            onClick={() => applyPreset(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="date-range-filter__custom">
        <input
          id="drf-start"
          type="date"
          className="date-range-filter__input"
          value={customStart}
          max={customEnd}
          onChange={(e) => setCustomStart(e.target.value)}
          aria-label="Ngày bắt đầu"
        />
        <span className="date-range-filter__sep">→</span>
        <input
          id="drf-end"
          type="date"
          className="date-range-filter__input"
          value={customEnd}
          min={customStart}
          onChange={(e) => setCustomEnd(e.target.value)}
          aria-label="Ngày kết thúc"
        />
        <button
          id="drf-apply"
          className="date-range-filter__btn date-range-filter__btn--apply"
          onClick={applyCustom}
          disabled={!customStart || !customEnd}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
};

export default DateRangeFilter;
