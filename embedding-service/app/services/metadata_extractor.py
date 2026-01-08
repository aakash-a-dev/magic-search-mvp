import re
from typing import Dict, List, Optional
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
import httpx
import io

BRANDS = {
    "nike", "adidas", "puma", "reebok", "converse", "vans", "new balance",
    "prada", "gucci", "versace", "louis vuitton", "chanel", "dior", "hermes",
    "ralph lauren", "tommy hilfiger", "calvin klein", "hugo boss",
    "patagonia", "north face", "columbia", "arcteryx",
    "ray-ban", "rayban", "oakley", "persol",
    "cartier", "rolex", "omega", "tag heuer", "seiko"
}

CATEGORIES = {
    "footwear": ["sneaker", "shoe", "boot", "sandal", "loafer", "slipper"],
    "tops": ["shirt", "t-shirt", "hoodie", "sweater", "jacket", "blazer", "coat"],
    "bottoms": ["pant", "jean", "short", "trouser", "chino", "sweatpant"],
    "accessories": ["watch", "bag", "sunglass", "hat", "cap", "belt", "wallet"]
}

STYLE_KEYWORDS = {
    "minimal": ["minimal", "simple", "clean", "basic"],
    "streetwear": ["streetwear", "urban", "street", "hip-hop"],
    "luxury": ["luxury", "premium", "designer", "high-end"],
    "casual": ["casual", "everyday", "comfortable"],
    "formal": ["formal", "dress", "suit", "business"],
    "sporty": ["sport", "athletic", "active", "performance"]
}

class MetadataExtractor:
    @staticmethod
    def extract_brand(title: str) -> Optional[str]:
        title_lower = title.lower()
        for brand in BRANDS:
            if brand in title_lower:
                return brand.title()
        return None
    
    @staticmethod
    def extract_category(title: str) -> Optional[str]:
        title_lower = title.lower()
        for category, keywords in CATEGORIES.items():
            for keyword in keywords:
                if keyword in title_lower:
                    return category.title()
        return None
    
    @staticmethod
    def extract_colors(title: str) -> List[str]:
        color_keywords = [
            "black", "white", "red", "blue", "green", "yellow", "orange",
            "purple", "pink", "brown", "gray", "grey", "navy", "beige",
            "tan", "khaki", "maroon", "burgundy", "olive", "coral"
        ]
        
        found_colors = []
        title_lower = title.lower()
        for color in color_keywords:
            if color in title_lower:
                found_colors.append(color.title())
        return found_colors
    
    @staticmethod
    def extract_style(title: str) -> List[str]:
        title_lower = title.lower()
        found_styles = []
        for style, keywords in STYLE_KEYWORDS.items():
            if any(keyword in title_lower for keyword in keywords):
                found_styles.append(style)
        return found_styles
    
    @staticmethod
    def extract_type(title: str) -> Optional[str]:
        type_patterns = {
            "low top": r"low\s*top",
            "high top": r"high\s*top",
            "oversized": r"oversized|oversize",
            "slim fit": r"slim\s*fit",
            "regular fit": r"regular\s*fit",
            "relaxed fit": r"relaxed\s*fit"
        }
        
        title_lower = title.lower()
        for type_name, pattern in type_patterns.items():
            if re.search(pattern, title_lower):
                return type_name.title()
        return None
    
    @staticmethod
    def extract_from_title(title: str) -> Dict:
        return {
            "brand": MetadataExtractor.extract_brand(title),
            "category": MetadataExtractor.extract_category(title),
            "colors": MetadataExtractor.extract_colors(title),
            "style": MetadataExtractor.extract_style(title),
            "type": MetadataExtractor.extract_type(title)
        }
    
    @staticmethod
    async def extract_dominant_colors(image_url: str, n_colors: int = 3) -> List[List[int]]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content)).convert("RGB")
        
        image_array = np.array(image)
        pixels = image_array.reshape(-1, 3)
        
        kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
        kmeans.fit(pixels)
        
        colors = kmeans.cluster_centers_.astype(int).tolist()
        return colors







