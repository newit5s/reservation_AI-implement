const highlights = [
  {
    title: 'VIP Lounge',
    description: 'Exclusive access for premium members with complimentary drinks.'
  },
  {
    title: 'Smart Reminders',
    description: 'Automated SMS reminders to reduce no-shows and cancellations.'
  },
  {
    title: 'Flexible Scheduling',
    description: 'Real-time availability across multiple branches and table types.'
  }
];

const CustomerHighlights = () => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {highlights.map((item) => (
        <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
          <p className="text-sm text-slate-500">{item.description}</p>
        </article>
      ))}
    </section>
  );
};

export default CustomerHighlights;
