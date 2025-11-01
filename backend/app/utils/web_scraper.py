"""
Web Scraper for Public Domain Parenting Content
Scrapes non-copyrighted content from CDC, CPSC, NIH, and other government sources
"""
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import re
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class ParentingContentScraper:
    """Scrapes public domain parenting content from government sources"""

    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; ParentingBot/1.0; +education)'
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        _ = (exc_type, exc_val, exc_tb)  # Unused but required by protocol
        if self.session:
            await self.session.close()

    async def fetch_page(self, url: str) -> Optional[str]:
        """Fetch HTML content from URL"""
        if not self.session:
            logger.error("Session not initialized")
            return None
        try:
            async with self.session.get(url, timeout=30) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    logger.warning(f"Failed to fetch {url}: Status {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove leading/trailing whitespace
        text = text.strip()
        return text

    def extract_text_from_soup(self, soup: BeautifulSoup, tag: str = 'p') -> List[str]:
        """Extract text from HTML soup"""
        paragraphs = []
        for element in soup.find_all(tag):
            text = self.clean_text(element.get_text())
            if len(text) > 50:  # Only include substantial paragraphs
                paragraphs.append(text)
        return paragraphs

    async def scrape_cdc_child_development(self) -> List[Dict[str, Any]]:
        """Scrape CDC child development milestones and guidelines"""
        content_items = []

        # CDC URLs - Updated to current working URLs
        urls = {
            "child_development": "https://www.cdc.gov/child-development/index.html",
            "positive_parenting_tips": "https://www.cdc.gov/child-development/positive-parenting-tips/index.html",
            "developmental_milestones": "https://www.cdc.gov/child-development/tracking/milestones.html",
            "injury_prevention": "https://www.cdc.gov/safety/falls/index.html",
            "vehicle_safety": "https://www.cdc.gov/transportation-safety/child-passenger-safety/index.html",
        }

        for topic, url in urls.items():
            paragraphs = []  # Initialize to avoid unbound variable
            try:
                html = await self.fetch_page(url)
                if not html:
                    continue

                soup = BeautifulSoup(html, 'html.parser')

                # Extract main content
                main_content = soup.find('main') or soup.find('article') or soup.find('div', class_='content')

                if main_content:
                    paragraphs = self.extract_text_from_soup(main_content)

                    # Group paragraphs into chunks
                    for i in range(0, len(paragraphs), 3):
                        chunk = ' '.join(paragraphs[i:i+3])
                        if len(chunk) > 100:
                            content_items.append({
                                "text": chunk,
                                "metadata": {
                                    "source_type": "cdc",
                                    "source_title": f"CDC - {topic.replace('_', ' ').title()}",
                                    "source_url": url,
                                    "license_type": "public_domain",
                                    "is_public_domain": True,
                                    "topic": topic,
                                    "age_range": "all",
                                    "section": "Child Development"
                                }
                            })

                    logger.info(f"Scraped CDC {topic}: {len(paragraphs)} paragraphs")

            except Exception as e:
                logger.error(f"Error scraping CDC {topic}: {e}")

        return content_items

    async def scrape_cpsc_safety(self) -> List[Dict[str, Any]]:
        """Scrape CPSC product safety information"""
        content_items = []

        urls = {
            "toy_safety": "https://www.cpsc.gov/safety-education/safety-guides/toys",
            "nursery_safety": "https://www.cpsc.gov/safety-education/safety-guides/kids-and-babies/cribs",
            "playground_safety": "https://www.cpsc.gov/safety-education/safety-guides/kids-and-babies/playgrounds",
            "home_safety": "https://www.cpsc.gov/safety-education/safety-guides/home",
            "carbon_monoxide": "https://www.cpsc.gov/safety-education/safety-guides/carbon-monoxide",
        }

        for topic, url in urls.items():
            paragraphs = []  # Initialize to avoid unbound variable
            try:
                html = await self.fetch_page(url)
                if not html:
                    continue

                soup = BeautifulSoup(html, 'html.parser')

                # Extract safety tips and guidelines
                content = soup.find('main') or soup.find('article')

                if content:
                    paragraphs = self.extract_text_from_soup(content)

                    for i in range(0, len(paragraphs), 2):
                        chunk = ' '.join(paragraphs[i:i+2])
                        if len(chunk) > 100:
                            content_items.append({
                                "text": chunk,
                                "metadata": {
                                    "source_type": "cpsc",
                                    "source_title": f"CPSC - {topic.replace('_', ' ').title()}",
                                    "source_url": url,
                                    "license_type": "public_domain",
                                    "is_public_domain": True,
                                    "topic": topic,
                                    "age_range": "all",
                                    "section": "Product Safety"
                                }
                            })

                    logger.info(f"Scraped CPSC {topic}: {len(paragraphs)} paragraphs")

            except Exception as e:
                logger.error(f"Error scraping CPSC {topic}: {e}")

        return content_items

    async def scrape_nih_medlineplus(self) -> List[Dict[str, Any]]:
        """Scrape NIH MedlinePlus parenting information"""
        content_items = []

        urls = {
            "child_safety": "https://medlineplus.gov/childsafety.html",
            "child_nutrition": "https://medlineplus.gov/childnutrition.html",
            "child_mental_health": "https://medlineplus.gov/childmentalhealth.html",
            "parenting": "https://medlineplus.gov/parenting.html",
        }

        for topic, url in urls.items():
            paragraphs = []  # Initialize to avoid unbound variable
            try:
                html = await self.fetch_page(url)
                if not html:
                    continue

                soup = BeautifulSoup(html, 'html.parser')

                # MedlinePlus has summaries and key points
                summary = soup.find('div', id='topic-summary')

                if summary:
                    paragraphs = self.extract_text_from_soup(summary)

                    for paragraph in paragraphs:
                        if len(paragraph) > 100:
                            content_items.append({
                                "text": paragraph,
                                "metadata": {
                                    "source_type": "nih",
                                    "source_title": f"NIH MedlinePlus - {topic.replace('_', ' ').title()}",
                                    "source_url": url,
                                    "license_type": "public_domain",
                                    "is_public_domain": True,
                                    "topic": topic,
                                    "age_range": "all",
                                    "section": "Health Information"
                                }
                            })

                    logger.info(f"Scraped NIH {topic}: {len(paragraphs)} paragraphs")

            except Exception as e:
                logger.error(f"Error scraping NIH {topic}: {e}")

        return content_items

    async def scrape_healthychildren_org(self) -> List[Dict[str, Any]]:
        """Scrape HealthyChildren.org (AAP) public content"""
        content_items = []

        # Note: HealthyChildren.org content is copyrighted by AAP
        # We can only use content that is explicitly public domain or openly licensed
        # For safety, we'll skip this source unless we can verify licensing

        logger.info("Skipping HealthyChildren.org (copyright restrictions)")
        return content_items

    async def scrape_all_sources(self) -> List[Dict[str, Any]]:
        """Scrape content from all public domain sources"""
        all_content = []

        logger.info("Starting web scraping of public domain parenting content...")

        # Scrape all sources concurrently
        tasks = [
            self.scrape_cdc_child_development(),
            self.scrape_cpsc_safety(),
            self.scrape_nih_medlineplus(),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Scraping task failed: {result}")
            elif isinstance(result, list):
                all_content.extend(result)

        logger.info(f"Scraped total of {len(all_content)} content items")

        return all_content


async def scrape_and_save(output_file: str = "scraped_content.json"):
    """Scrape content and save to JSON file"""
    import json

    async with ParentingContentScraper() as scraper:
        content = await scraper.scrape_all_sources()

        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved {len(content)} items to {output_file}")
        return content


async def scrape_and_ingest():
    """Scrape content and directly ingest into RAG knowledge base"""
    from app.services.rag_service import rag_service

    async with ParentingContentScraper() as scraper:
        content = await scraper.scrape_all_sources()

        if not content:
            logger.warning("No content scraped")
            return {"success": False, "message": "No content scraped"}

        # Extract texts and metadata
        texts = [item["text"] for item in content]
        metadatas = [item["metadata"] for item in content]

        # Ingest into RAG
        logger.info(f"Ingesting {len(texts)} scraped items into knowledge base...")
        doc_ids = await rag_service.add_documents_batch(texts, metadatas)

        logger.info(f"Successfully ingested {len(doc_ids)} documents")

        stats = await rag_service.get_collection_stats()

        return {
            "success": True,
            "documents_added": len(doc_ids),
            "stats": stats
        }


if __name__ == "__main__":
    # Test scraping
    result = asyncio.run(scrape_and_ingest())
    print(result)
