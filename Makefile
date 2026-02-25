PYTHON ?= python3
PIP ?= $(PYTHON) -m pip

.PHONY: install run decode

FILE ?= iptv.m3u8

install:
	$(PIP) install -r requirements.txt

run:
	$(PYTHON) generate_playlist.py

decode:
	$(PYTHON) generate_playlist.py --decode-file $(FILE)
