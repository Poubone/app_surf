import * as SQLite from 'expo-sqlite';
import { importDatabaseFromAssetAsync } from 'expo-sqlite';
import type { Spot } from '@app-surf/scoring';

const DATABASE_NAME = 'spots.db';

const ASSET_SOURCE = {
  assetId: require('../../assets/spots.db'),
};

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function rowToSpot(row: Record<string, unknown>): Spot {
  return {
    spotId: row.spot_id as string,
    name: row.name as string,
    slug: row.slug as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    beachOrientation: row.beach_orientation as number,
    swellAngleMin: row.swell_angle_min as number,
    swellAngleMax: row.swell_angle_max as number,
    windOffshoreMin: row.wind_offshore_min as number,
    windOffshoreMax: row.wind_offshore_max as number,
    idealSwellHeightMin: row.ideal_swell_height_min as number,
    idealSwellHeightMax: row.ideal_swell_height_max as number,
    tideOptimalStage: row.tide_optimal_stage as Spot['tideOptimalStage'],
    bottomType: row.bottom_type as string | undefined,
    level: row.level as string | undefined,
    descriptionFr: row.description_fr as string | undefined,
  };
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await importDatabaseFromAssetAsync(DATABASE_NAME, ASSET_SOURCE);
      dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
      return dbInstance;
    })();
  }

  return initPromise;
}

export async function loadSpots(): Promise<Spot[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM spots ORDER BY name');
  return rows.map((r) => rowToSpot(r as Record<string, unknown>));
}
