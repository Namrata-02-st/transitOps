const modules = [
  {
    title: "Fleet Management",
    description: "Manage vehicles and monitor their current status.",
  },
  {
    title: "Trip Operations",
    description: "Create trips, assign drivers and track progress.",
  },
  {
    title: "Maintenance",
    description: "Record servicing and upcoming maintenance tasks.",
  },
];

function App() {
  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            min-width: 320px;
            min-height: 100vh;
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f7fb;
            color: #172033;
          }

          button,
          input {
            font: inherit;
          }

          .app {
            min-height: 100vh;
          }

          .navbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 72px;
            padding: 0 7%;
            background: #ffffff;
            border-bottom: 1px solid #e4e9f1;
          }

          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #172033;
          }

          .logo span {
            color: #2563eb;
          }

          .status {
            padding: 8px 14px;
            border-radius: 20px;
            background: #dcfce7;
            color: #166534;
            font-size: 14px;
            font-weight: 600;
          }

          .main-content {
            width: min(1100px, 86%);
            margin: 0 auto;
            padding: 70px 0;
          }

          .hero {
            max-width: 760px;
            margin-bottom: 48px;
          }

          .eyebrow {
            margin-bottom: 12px;
            color: #2563eb;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .hero h1 {
            margin-bottom: 18px;
            font-size: clamp(36px, 6vw, 60px);
            line-height: 1.1;
          }

          .hero-description {
            color: #667085;
            font-size: 18px;
            line-height: 1.7;
          }

          .module-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 22px;
          }

          .module-card {
            padding: 28px;
            border: 1px solid #e4e9f1;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 8px 30px rgba(23, 32, 51, 0.06);
          }

          .card-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            margin-bottom: 24px;
            border-radius: 12px;
            background: #eff6ff;
            color: #2563eb;
            font-weight: 700;
          }

          .module-card h2 {
            margin-bottom: 12px;
            font-size: 20px;
          }

          .module-card p {
            color: #667085;
            line-height: 1.6;
          }

          @media (max-width: 800px) {
            .navbar {
              padding: 0 5%;
            }

            .main-content {
              width: 90%;
              padding: 50px 0;
            }

            .module-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="app">
        <nav className="navbar">
          <div className="logo">
            Transit<span>Ops</span>
          </div>

          <div className="status">Frontend running</div>
        </nav>

        <main className="main-content">
          <section className="hero">
            <p className="eyebrow">Smart Transport Operations</p>

            <h1>Manage your transport operations in one place.</h1>

            <p className="hero-description">
              TransitOps helps transport teams manage vehicles, drivers,
              trips, maintenance, fuel and operational expenses.
            </p>
          </section>

          <section className="module-grid">
            {modules.map((module, index) => (
              <article className="module-card" key={module.title}>
                <div className="card-number">0{index + 1}</div>

                <h2>{module.title}</h2>

                <p>{module.description}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}

export default App;