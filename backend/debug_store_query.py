import asyncio
import sys

sys.path.insert(0, '/Users/mohitkumar/Desktop/Antigravity/Gemini/RetailCortex/backend/src')

from tortoise import Tortoise
from src.db.connection import TORTOISE_ORM
from src.db.models.store import Store


async def main():
    try:
        await Tortoise.init(config=TORTOISE_ORM)
        stores = await Store.all().select_related('zone', 'category')
        print('Found', len(stores), 'stores')
        for s in stores[:5]:
            print(s.id, s.name)
    except Exception:
        import traceback

        traceback.print_exc()
    finally:
        await Tortoise.close_connections()


if __name__ == '__main__':
    asyncio.run(main())
