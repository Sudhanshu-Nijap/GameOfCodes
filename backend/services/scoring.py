import re
import math
from typing import List, Tuple


def calculate_relevance_score(
    text: str,
    title: str,
    primary_keyword: str,
    secondary_keywords: List[str]
) -> Tuple[float, List[str]]:
    """
    Relevance Sniper v4 — Primary-Gated Scoring Engine.

    Key design principle:
      Secondary keyword bonuses and the Synergy bonus are ONLY awarded
      when the primary keyword already has a meaningful match score (>= 10.0).
      This prevents spam sites that flood with secondary keywords from rising
      above legitimate primary-keyword matches.

    Score breakdown:
      Primary title exact match    -> +50  (clean intent signal)
      Primary body exact match     -> +5 * min(count, 10)  (capped, anti-spam)
      Primary frequency bonus      -> log(min(freq,15)+1) * 2  (soft, capped)

      [Only if primary_score >= 10.0]:
        Secondary title match      -> +20 per keyword
        Secondary body match       -> +5 per keyword (flat, not multiplied)
        Synergy bonus              -> +60 (both primary AND secondary found)
    """
    score = 0.0
    matched_keywords: List[str] = []

    text_clean  = text.lower()
    title_clean = title.lower()
    body_space  = text_clean

    primary_matched   = False
    secondary_matched = False
    primary_score     = 0.0

    # ── 1. PRIMARY KEYWORD (Phrase & Word Level) ──────────────────────────────
    if primary_keyword:
        pk = primary_keyword.lower().strip()

        # Exact phrase match (Highest Value)
        if re.search(rf'\b{re.escape(pk)}\b', title_clean):
            primary_score += 50.0
            primary_matched = True

        body_exact = len(re.findall(rf'\b{re.escape(pk)}\b', body_space))
        primary_score += min(body_exact, 10) * 10.0
        if body_exact > 0:
            primary_matched = True

        # Break down into individual words
        for word in pk.split():
            if len(word) <= 2: continue
            
            if re.search(rf'\b{re.escape(word)}\b', title_clean):
                primary_score += 15.0
                primary_matched = True
                
            word_count = len(re.findall(rf'\b{re.escape(word)}\b', body_space))
            primary_score += min(word_count, 15) * 3.0
            if word_count > 0:
                primary_matched = True

        score += primary_score
        if primary_matched:
            matched_keywords.append(primary_keyword)

    # ── 2. SECONDARY KEYWORDS (Active without gates) ─────────────────────────
    for sk in secondary_keywords:
        if not sk or not sk.strip():
            continue
        sk_lower = sk.lower().strip()
        sk_found = False

        if re.search(rf'\b{re.escape(sk_lower)}\b', title_clean):
            score += 20.0
            sk_found = True

        body_exact_sk = len(re.findall(rf'\b{re.escape(sk_lower)}\b', body_space))
        if body_exact_sk > 0:
            score += min(body_exact_sk, 15) * 5.0
            sk_found = True

        if sk_found:
            secondary_matched = True
            matched_keywords.append(sk)

    # ── 3. SYNERGY BONUS ─────────────────────────────────────────────────
    if primary_matched and secondary_matched:
        score += 60.0

    return round(score, 2), list(set(matched_keywords))
