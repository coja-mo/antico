import styles from './page.module.css';
import data from '@/data/antico_data.json';

export const metadata = {
  title: 'The Menu | Antico Ristoranté',
  description: 'Explore our authentic Italian menu featuring handcrafted pasta, fresh seafood, premium veal, and signature dishes by Chef Arturo Comegna.',
};

export default function MenuPage() {
  const { menu } = data;

  return (
    <div className={styles.menuPage}>
      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.script}>Buon Appetito</p>
          <h1>The Menu</h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>Authentic Italian cuisine, crafted with passion</p>
        </div>
      </section>

      {/* Menu Sections */}
      <section className={styles.menuBody}>
        <div className={styles.inner}>

          {/* Appetizers */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2>Appetizers</h2>
              <span className={styles.categoryLine} />
            </div>
            <div className={styles.itemGrid}>
              {menu.appetizers.map((item, i) => (
                <div key={i} className={styles.menuItem}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Salads */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2>Salads</h2>
              <span className={styles.categoryLine} />
            </div>
            <div className={styles.itemGrid}>
              {menu.salads.map((item, i) => (
                <div key={i} className={styles.menuItem}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className={styles.quote}>
            <p className={styles.quoteText}>Life's Too Short For Average Food</p>
          </div>

          {/* Entrees */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2>Entrées</h2>
              <span className={styles.categoryLine} />
            </div>
            <p className={styles.categoryNote}>{menu.entrees.note}</p>
            <div className={styles.itemGrid}>
              {menu.entrees.items.map((item, i) => (
                <div key={i} className={styles.menuItem}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              ))}
            </div>
            <div className={styles.addOns}>
              <p className={styles.addOnsTitle}>Entrée Add-ons & Upgrades</p>
              <div className={styles.addOnsList}>
                {menu.entrees.addOns.map((item, i) => (
                  <span key={i} className={styles.addOnTag}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Desserts */}
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2>Desserts</h2>
              <span className={styles.categoryLine} />
            </div>
            <div className={styles.dessertCard}>
              <p className={styles.dessertNote}>{menu.desserts.note}</p>
              <p className={styles.dessertHint}>
                <span className={styles.dessertStar}>★</span> 
                Hint: {menu.desserts.featured} is delicious.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
