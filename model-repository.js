(function () {
  var config = window.MODEL_REPO_PAGE_CONFIG || {};
  var state = {
    loaded: false,
    loading: false,
    saving: false,
    saveQueued: false,
    saveTimer: null,
    managerEnabled: false,
    canManage: false,
    managerKey: "",
    manifest: { version: 1, updated_at: "", series: [] },
    showingSeed: false,
    crop: null,
  };

  var els = {};

  function init() {
    els.status = document.getElementById("mr-status");
    els.seriesList = document.getElementById("mr-series-list");
    els.seriesTitle = document.getElementById("mr-series-title");
    els.seriesSlug = document.getElementById("mr-series-slug");
    els.seriesDescription = document.getElementById("mr-series-description");
    els.createSeries = document.getElementById("mr-create-series");
    els.refresh = document.getElementById("mr-refresh-repo");
    els.scrollManager = document.getElementById("mr-scroll-manager");
    els.managerKey = document.getElementById("mr-manager-key");
    els.unlock = document.getElementById("mr-unlock-manager");
    els.clear = document.getElementById("mr-clear-manager");

    state.managerKey = readStoredManagerKey();
    if (els.managerKey && state.managerKey) els.managerKey.value = state.managerKey;

    if (els.unlock) els.unlock.addEventListener("click", handleUnlock);
    if (els.clear) els.clear.addEventListener("click", handleClearManagerKey);
    if (els.createSeries) els.createSeries.addEventListener("click", handleCreateSeries);
    if (els.refresh) els.refresh.addEventListener("click", loadRepository);
    if (els.scrollManager) els.scrollManager.addEventListener("click", function () {
      var manager = document.getElementById("mr-manager");
      if (manager) manager.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (els.seriesTitle) {
      els.seriesTitle.addEventListener("input", function () {
        if (!els.seriesSlug || els.seriesSlug.dataset.manual === "true") return;
        els.seriesSlug.value = slugify(els.seriesTitle.value, "");
      });
    }
    if (els.seriesSlug) {
      els.seriesSlug.addEventListener("input", function () {
        els.seriesSlug.dataset.manual = els.seriesSlug.value.trim() ? "true" : "";
      });
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("mousemove", handleCropMove);
    document.addEventListener("mouseup", endCropInteraction);
    document.addEventListener("touchmove", handleCropTouchMove, { passive: false });
    document.addEventListener("touchend", endCropInteraction);
    document.addEventListener("touchcancel", endCropInteraction);
    document.addEventListener("mousedown", handleCropStart);
    document.addEventListener("touchstart", handleCropTouchStart, { passive: false });

    loadRepository();
  }

  async function handleUnlock() {
    state.managerKey = String(els.managerKey && els.managerKey.value || "").trim();
    storeManagerKey(state.managerKey);
    await loadRepository();
    if (state.canManage) {
      setStatus("Manager mode unlocked. Uploads and edits are enabled.", "ok");
    } else if (!state.managerEnabled) {
      setStatus("The manager key is not configured on the server yet.", "err");
    } else {
      setStatus("That manager key was rejected.", "err");
    }
  }

  function handleClearManagerKey() {
    state.managerKey = "";
    storeManagerKey("");
    if (els.managerKey) els.managerKey.value = "";
    state.canManage = false;
    render();
    setStatus("Manager key cleared. Downloads stay public; uploads are now locked.", "info");
  }

  async function loadRepository() {
    if (state.loading) return;
    state.loading = true;
    setStatus("Loading repository…", "info");
    try {
      var response = await fetch(config.apiBase || "/api/model-repository", {
        headers: buildAuthHeaders(),
        cache: "no-store"
      });
      var payload = await response.json();
      if (!response.ok || !payload || !payload.ok) {
        throw new Error(payload && payload.error ? payload.error : "Could not load repository.");
      }
      state.loaded = true;
      state.managerEnabled = payload.manager_enabled !== false;
      state.canManage = !!payload.can_manage;
      state.manifest = normalizeManifest(payload.manifest);
      state.showingSeed = false;
      if (!(state.manifest.series || []).length) {
        var seedManifest = await fetchSeedManifest();
        if (seedManifest && Array.isArray(seedManifest.series) && seedManifest.series.length) {
          state.manifest = normalizeManifest(seedManifest);
          state.showingSeed = true;
        }
      }
      render();
      if (state.showingSeed && state.canManage) {
        setStatus("Showing the local seed library. Make edits and save to publish a live repository manifest.", "info");
      } else if (state.showingSeed) {
        setStatus("Showing the local seed library. Enter the manager key above to publish or edit the live manifest.", "info");
      } else if (state.canManage) {
        setStatus("Repository loaded. Manager mode is unlocked.", "ok");
      } else if (state.managerEnabled) {
        setStatus("Downloads are open. Enter the manager key above to upload or organize series.", "info");
      } else {
        setStatus("Repository loaded. Manager uploads are not configured yet on this site.", "info");
      }
    } catch (error) {
      console.error("[chain-model-repository] load failed:", error);
      setStatus(error && error.message ? error.message : "Could not load repository.", "err");
      render();
    } finally {
      state.loading = false;
    }
  }

  function render() {
    renderManagerState();
    renderSeriesList();
  }

  function renderManagerState() {
    var disabled = !state.canManage;
    if (els.createSeries) els.createSeries.disabled = disabled;
    if (els.seriesTitle) els.seriesTitle.disabled = disabled;
    if (els.seriesSlug) els.seriesSlug.disabled = disabled;
    if (els.seriesDescription) els.seriesDescription.disabled = disabled;
  }

  function renderSeriesList() {
    if (!els.seriesList) return;
    var series = Array.isArray(state.manifest.series) ? state.manifest.series : [];
    if (!series.length) {
      els.seriesList.innerHTML =
        '<section class="mr-empty">' +
          '<h2 class="mr-title" style="font-size:28px; margin:0 0 8px;">No model series yet.</h2>' +
          '<p class="mr-copy">Create the first series above, then upload reference images, import a folder of model shots, or attach ZIP bundles for direct download.</p>' +
        '</section>';
      return;
    }
    els.seriesList.innerHTML = series.map(function (entry, seriesIndex) {
      var imageCount = entry.images.length;
      var archiveCount = entry.archives.length;
      var imageHtml = imageCount
        ? '<div class="mr-image-grid">' + entry.images.map(function (image, imageIndex) {
            return renderImageCard(entry, image, seriesIndex, imageIndex);
          }).join("") + "</div>"
        : '<div class="mr-note">No reference images uploaded yet. Use single-image upload or a full folder import.</div>';

      var archiveHtml = archiveCount
        ? '<div class="mr-archive-list">' + entry.archives.map(function (archive, archiveIndex) {
            return renderArchiveCard(entry, archive, seriesIndex, archiveIndex);
          }).join("") + "</div>"
        : '<div class="mr-note">No ZIP bundle attached yet. Upload one if you want a packaged download beside the single images.</div>';

      return '' +
        '<section class="mr-series-card" data-series-id="' + esc(entry.id) + '">' +
          '<div class="mr-series-head">' +
            '<div class="mr-series-meta">' +
              (state.canManage
                ? '<input class="mr-input" type="text" value="' + escAttr(entry.title) + '" maxlength="120" data-series-id="' + esc(entry.id) + '" data-field="title" />'
                : '<h2 class="mr-series-title">' + esc(entry.title) + '</h2>') +
              (state.canManage
                ? '<textarea class="mr-textarea" rows="3" maxlength="1600" data-series-id="' + esc(entry.id) + '" data-field="description">' + esc(entry.description) + '</textarea>'
                : '<p class="mr-series-description">' + esc(entry.description || "No description yet.") + '</p>') +
              '<div class="mr-series-stats">' +
                '<span class="mr-stat">' + imageCount + ' image' + (imageCount === 1 ? '' : 's') + '</span>' +
                '<span class="mr-stat">' + archiveCount + ' ZIP' + (archiveCount === 1 ? '' : 's') + '</span>' +
                '<span class="mr-stat">' + esc(entry.slug) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="mr-series-actions">' +
              (state.canManage
                ? '<button type="button" class="mr-btn secondary" data-action="upload-images" data-series-id="' + esc(entry.id) + '">Upload Images</button>' +
                  '<button type="button" class="mr-btn secondary" data-action="upload-folder" data-series-id="' + esc(entry.id) + '">Upload Folder</button>' +
                  '<button type="button" class="mr-btn secondary" data-action="upload-archive" data-series-id="' + esc(entry.id) + '">Upload ZIP</button>' +
                  '<button type="button" class="mr-btn danger" data-action="delete-series" data-series-id="' + esc(entry.id) + '">Remove Series</button>'
                : '') +
              '<button type="button" class="mr-btn" data-action="download-series" data-series-id="' + esc(entry.id) + '">Download Folder (.zip)</button>' +
            '</div>' +
          '</div>' +
          '<div class="mr-series-grid">' +
            '<div class="mr-assets-block">' +
              '<div class="mr-block-head"><h3>Reference Images</h3></div>' +
              imageHtml +
            '</div>' +
            '<div class="mr-downloads-block">' +
              '<div class="mr-block-head"><h3>Series ZIP Downloads</h3></div>' +
              archiveHtml +
            '</div>' +
          '</div>' +
        '</section>';
    }).join("");
  }

  function renderImageCard(series, image) {
    var zoomLabel = Math.round(clampZoom(image.zoom, 1) * 100) + "%";
    var imageStyle = renderImageStyle(image);
    return '' +
      '<article class="mr-image-card" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '">' +
        '<div class="mr-image-frame">' +
          '<img src="' + escAttr(image.url) + '" alt="' + escAttr(image.title || image.file_name || "Model reference image") + '" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '" draggable="false" style="' + imageStyle + '" />' +
          '<span class="mr-image-hint">&#8690; drag image to frame</span>' +
        '</div>' +
        '<div class="mr-zoom-row">' +
          '<label for="mr-zoom-' + esc(series.id) + '-' + esc(image.id) + '">Zoom</label>' +
          '<input id="mr-zoom-' + esc(series.id) + '-' + esc(image.id) + '" type="range" min="100" max="250" step="1" value="' + Math.round(clampZoom(image.zoom, 1) * 100) + '" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '" data-field="zoom" />' +
          '<span class="mr-zoom-value">' + zoomLabel + '</span>' +
        '</div>' +
        (state.canManage
          ? '<input class="mr-input" type="text" maxlength="120" placeholder="Image title" value="' + escAttr(image.title || "") + '" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '" data-field="image-title" />' +
            '<textarea class="mr-textarea" rows="3" maxlength="600" placeholder="Optional notes for this image" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '" data-field="image-description">' + esc(image.description || "") + '</textarea>'
          : '<div class="mr-note">' + esc(image.title || image.file_name || "Reference image") + (image.description ? '<br>' + esc(image.description) : '') + '</div>') +
        '<div class="mr-asset-actions">' +
          '<button type="button" class="mr-btn secondary" data-action="download-image" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '">Download Image</button>' +
          (state.canManage
            ? '<button type="button" class="mr-btn ghost" data-action="remove-image" data-series-id="' + esc(series.id) + '" data-image-id="' + esc(image.id) + '">Remove</button>'
            : '') +
        '</div>' +
      '</article>';
  }

  function renderArchiveCard(series, archive) {
    return '' +
      '<article class="mr-archive-card" data-series-id="' + esc(series.id) + '" data-archive-id="' + esc(archive.id) + '">' +
        '<strong>' + esc(archive.file_name || "Series ZIP") + '</strong>' +
        '<div class="mr-note">' + formatBytes(archive.bytes) + ' · ' + esc(archive.created_at ? new Date(archive.created_at).toLocaleString() : "Recently uploaded") + '</div>' +
        '<div class="mr-asset-actions">' +
          '<a class="mr-btn secondary" href="' + escAttr(archive.url) + '" download="' + escAttr(archive.file_name || "series.zip") + '">Download ZIP</a>' +
          (state.canManage
            ? '<button type="button" class="mr-btn ghost" data-action="remove-archive" data-series-id="' + esc(series.id) + '" data-archive-id="' + esc(archive.id) + '">Remove</button>'
            : '') +
        '</div>' +
      '</article>';
  }

  function handleCreateSeries() {
    if (!state.canManage) {
      setStatus("Unlock manager mode before creating a series.", "err");
      return;
    }
    var title = els.seriesTitle ? String(els.seriesTitle.value || "").trim() : "";
    if (!title) {
      setStatus("Give the series a title first.", "err");
      if (els.seriesTitle) els.seriesTitle.focus();
      return;
    }
    var slugValue = els.seriesSlug ? String(els.seriesSlug.value || "").trim() : "";
    var description = els.seriesDescription ? String(els.seriesDescription.value || "").trim() : "";
    state.manifest.series.unshift({
      id: "series_" + randomId(),
      slug: slugify(slugValue || title, "model-series"),
      title: title,
      description: description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
      archives: []
    });
    if (els.seriesTitle) els.seriesTitle.value = "";
    if (els.seriesSlug) {
      els.seriesSlug.value = "";
      els.seriesSlug.dataset.manual = "";
    }
    if (els.seriesDescription) els.seriesDescription.value = "";
    renderSeriesList();
    setStatus("Series created. Start uploading images, folders, or ZIP bundles.", "ok");
    scheduleSave();
  }

  function handleInput(event) {
    var target = event.target;
    if (!target || !target.dataset) return;
    var seriesId = String(target.dataset.seriesId || "").trim();
    if (!seriesId) return;
    var series = findSeries(seriesId);
    if (!series) return;

    if (target.dataset.field === "title") {
      series.title = String(target.value || "").trim().slice(0, 120) || "Untitled Series";
      if (!series.slug) series.slug = slugify(series.title, series.id);
      scheduleSave();
      return;
    }
    if (target.dataset.field === "description") {
      series.description = String(target.value || "").trim().slice(0, 1600);
      scheduleSave();
      return;
    }

    var image = findImage(series, target.dataset.imageId);
    if (!image) return;

    if (target.dataset.field === "image-title") {
      image.title = String(target.value || "").trim().slice(0, 120);
      scheduleSave();
      return;
    }
    if (target.dataset.field === "image-description") {
      image.description = String(target.value || "").trim().slice(0, 600);
      scheduleSave();
      return;
    }
    if (target.dataset.field === "zoom") {
      image.zoom = clampZoom((Number(target.value) || 100) / 100, 1);
      var card = target.closest(".mr-image-card");
      if (card) {
        var zoomValue = card.querySelector(".mr-zoom-value");
        if (zoomValue) zoomValue.textContent = Math.round(image.zoom * 100) + "%";
        var img = card.querySelector(".mr-image-frame img");
        applyImageStyle(img, image.cropX, image.cropY, image.zoom);
      }
      scheduleSave(350);
    }
  }

  function handleClick(event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = String(button.dataset.action || "");
    var seriesId = String(button.dataset.seriesId || "");
    var imageId = String(button.dataset.imageId || "");
    var archiveId = String(button.dataset.archiveId || "");

    if (action === "upload-images") {
      event.preventDefault();
      openFilePicker(seriesId, false, false);
      return;
    }
    if (action === "upload-folder") {
      event.preventDefault();
      openFilePicker(seriesId, true, false);
      return;
    }
    if (action === "upload-archive") {
      event.preventDefault();
      openFilePicker(seriesId, false, true);
      return;
    }
    if (action === "download-series") {
      event.preventDefault();
      downloadSeriesZip(seriesId).catch(handleUploadError);
      return;
    }
    if (action === "download-image") {
      event.preventDefault();
      downloadSingleImage(seriesId, imageId);
      return;
    }
    if (!state.canManage) return;

    if (action === "delete-series") {
      event.preventDefault();
      deleteSeries(seriesId);
      return;
    }
    if (action === "remove-image") {
      event.preventDefault();
      removeImage(seriesId, imageId);
      return;
    }
    if (action === "remove-archive") {
      event.preventDefault();
      removeArchive(seriesId, archiveId);
    }
  }

  function deleteSeries(seriesId) {
    var series = findSeries(seriesId);
    if (!series) return;
    if (!window.confirm('Remove "' + series.title + '" from the repository? Uploaded assets stay in Cloudinary, but the series will disappear from this page.')) return;
    state.manifest.series = state.manifest.series.filter(function (entry) { return entry.id !== seriesId; });
    renderSeriesList();
    setStatus("Series removed from the repository manifest.", "ok");
    scheduleSave();
  }

  function removeImage(seriesId, imageId) {
    var series = findSeries(seriesId);
    if (!series) return;
    series.images = series.images.filter(function (image) { return image.id !== imageId; });
    renderSeriesList();
    setStatus("Image removed from the series.", "ok");
    scheduleSave();
  }

  function removeArchive(seriesId, archiveId) {
    var series = findSeries(seriesId);
    if (!series) return;
    series.archives = series.archives.filter(function (archive) { return archive.id !== archiveId; });
    renderSeriesList();
    setStatus("ZIP removed from the series.", "ok");
    scheduleSave();
  }

  function openFilePicker(seriesId, directoryMode, archiveMode) {
    if (!state.canManage) {
      setStatus("Unlock manager mode before uploading files.", "err");
      return;
    }
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = !archiveMode;
    input.accept = archiveMode ? ".zip,application/zip" : "image/*";
    if (directoryMode) input.setAttribute("webkitdirectory", "");
    input.addEventListener("change", function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;
      if (archiveMode) uploadArchive(seriesId, files[0]).catch(handleUploadError);
      else uploadImages(seriesId, files, directoryMode).catch(handleUploadError);
    });
    input.click();
  }

  async function uploadImages(seriesId, files, directoryMode) {
    var series = findSeries(seriesId);
    if (!series) return;
    setStatus("Uploading " + files.length + " image" + (files.length === 1 ? "" : "s") + " to " + series.title + "…", "info");
    for (var i = 0; i < files.length; i += 1) {
      var file = files[i];
      if (!file || !String(file.type || "").toLowerCase().startsWith("image/")) continue;
      var formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "image");
      formData.append("series_slug", series.slug);
      if (directoryMode && file.webkitRelativePath) {
        formData.append("relative_path", file.webkitRelativePath);
      }
      var response = await fetch(config.uploadEndpoint || "/api/model-repository-upload", {
        method: "POST",
        headers: buildAuthHeaders(),
        body: formData
      });
      var payload = await response.json();
      if (!response.ok || !payload || !payload.ok || !payload.asset) {
        throw new Error(payload && payload.error ? payload.error : "Image upload failed.");
      }
      series.images.push(normalizeImage(payload.asset));
      renderSeriesList();
      setStatus("Uploaded " + (i + 1) + " of " + files.length + " image" + (files.length === 1 ? "" : "s") + ".", "info");
    }
    await saveManifestNow();
    setStatus("Image upload finished for " + series.title + ".", "ok");
  }

  async function uploadArchive(seriesId, file) {
    var series = findSeries(seriesId);
    if (!series) return;
    setStatus("Uploading ZIP to " + series.title + "…", "info");
    var formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "archive");
    formData.append("series_slug", series.slug);
    var response = await fetch(config.uploadEndpoint || "/api/model-repository-upload", {
      method: "POST",
      headers: buildAuthHeaders(),
      body: formData
    });
    var payload = await response.json();
    if (!response.ok || !payload || !payload.ok || !payload.asset) {
      throw new Error(payload && payload.error ? payload.error : "ZIP upload failed.");
    }
    series.archives.unshift(normalizeArchive(payload.asset));
    renderSeriesList();
    await saveManifestNow();
    setStatus("ZIP uploaded for " + series.title + ".", "ok");
  }

  function handleUploadError(error) {
    console.error("[chain-model-repository] upload failed:", error);
    setStatus(error && error.message ? error.message : "Upload failed.", "err");
  }

  async function saveManifestNow() {
    if (!state.canManage || !state.loaded) return;
    if (state.saving) {
      state.saveQueued = true;
      return;
    }
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      state.saveTimer = null;
    }
    state.saving = true;
    setStatus("Saving repository…", "info");
    try {
      var response = await fetch(config.apiBase || "/api/model-repository", {
        method: "POST",
        headers: Object.assign({
          "Content-Type": "application/json"
        }, buildAuthHeaders()),
        body: JSON.stringify({
          _loaded: true,
          manifest: state.manifest
        })
      });
      var payload = await response.json();
      if (!response.ok || !payload || !payload.ok || !payload.manifest) {
        throw new Error(payload && payload.error ? payload.error : "Could not save repository.");
      }
      state.manifest = normalizeManifest(payload.manifest);
      renderSeriesList();
      setStatus("Repository saved.", "ok");
    } catch (error) {
      console.error("[chain-model-repository] save failed:", error);
      setStatus(error && error.message ? error.message : "Could not save repository.", "err");
      if (/key/i.test(String(error && error.message || ""))) {
        state.canManage = false;
        renderManagerState();
      }
    } finally {
      state.saving = false;
      if (state.saveQueued) {
        state.saveQueued = false;
        saveManifestNow();
      }
    }
  }

  function scheduleSave(delay) {
    if (!state.canManage) return;
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveManifestNow, typeof delay === "number" ? delay : 700);
  }

  async function downloadSeriesZip(seriesId) {
    var series = findSeries(seriesId);
    if (!series) return;
    if (series.archives && series.archives.length && series.archives[0] && series.archives[0].url) {
      var archive = series.archives[0];
      triggerDownload(archive.url, archive.file_name || slugify(series.slug || series.title, "model-series") + ".zip");
      setStatus("ZIP download ready for " + series.title + ".", "ok");
      return;
    }
    if (!series.images.length) {
      setStatus("This series does not have any images to package yet.", "err");
      return;
    }
    if (!window.JSZip) {
      setStatus("ZIP download is still loading. Try again in a moment.", "err");
      return;
    }
    setStatus("Building ZIP for " + series.title + "…", "info");
    var zip = new window.JSZip();
    var root = slugify(series.slug || series.title, "model-series");
    for (var i = 0; i < series.images.length; i += 1) {
      var image = series.images[i];
      var response = await fetch(image.url, { mode: "cors" });
      if (!response.ok) throw new Error("Could not fetch " + (image.file_name || "image") + " for ZIP download.");
      var blob = await response.blob();
      zip.file(root + "/" + buildArchivePath(image), blob);
    }
    var zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    triggerDownload(URL.createObjectURL(zipBlob), root + ".zip");
    setStatus("ZIP download ready for " + series.title + ".", "ok");
  }

  function downloadSingleImage(seriesId, imageId) {
    var series = findSeries(seriesId);
    var image = series ? findImage(series, imageId) : null;
    if (!image || !image.url) return;
    triggerDownload(image.url, image.file_name || "model-image");
  }

  function handleCropStart(event) {
    if (!state.canManage) return;
    var img = event.target && event.target.closest ? event.target.closest(".mr-image-frame img") : null;
    if (!img) return;
    event.preventDefault();
    var series = findSeries(img.dataset.seriesId);
    var image = series ? findImage(series, img.dataset.imageId) : null;
    if (!image) return;
    img.classList.add("adjusting");
    state.crop = {
      img: img,
      image: image,
      startX: event.clientX,
      startY: event.clientY,
      origCropX: clampPercent(image.cropX, 50),
      origCropY: clampPercent(image.cropY, 50),
      zoom: clampZoom(image.zoom, 1),
      currentX: clampPercent(image.cropX, 50),
      currentY: clampPercent(image.cropY, 50)
    };
  }

  function handleCropTouchStart(event) {
    if (!state.canManage) return;
    var img = event.target && event.target.closest ? event.target.closest(".mr-image-frame img") : null;
    if (!img) return;
    var touch = event.touches && event.touches[0];
    if (!touch) return;
    event.preventDefault();
    var series = findSeries(img.dataset.seriesId);
    var image = series ? findImage(series, img.dataset.imageId) : null;
    if (!image) return;
    img.classList.add("adjusting");
    state.crop = {
      img: img,
      image: image,
      startX: touch.clientX,
      startY: touch.clientY,
      origCropX: clampPercent(image.cropX, 50),
      origCropY: clampPercent(image.cropY, 50),
      zoom: clampZoom(image.zoom, 1),
      currentX: clampPercent(image.cropX, 50),
      currentY: clampPercent(image.cropY, 50)
    };
  }

  function handleCropMove(event) {
    if (!state.crop) return;
    var dx = event.clientX - state.crop.startX;
    var dy = event.clientY - state.crop.startY;
    var nextX = Math.max(0, Math.min(100, state.crop.origCropX - dx * 0.5));
    var nextY = Math.max(0, Math.min(100, state.crop.origCropY - dy * 0.5));
    state.crop.currentX = nextX;
    state.crop.currentY = nextY;
    applyImageStyle(state.crop.img, nextX, nextY, state.crop.zoom);
  }

  function handleCropTouchMove(event) {
    if (!state.crop) return;
    var touch = event.touches && event.touches[0];
    if (!touch) return;
    event.preventDefault();
    var dx = touch.clientX - state.crop.startX;
    var dy = touch.clientY - state.crop.startY;
    var nextX = Math.max(0, Math.min(100, state.crop.origCropX - dx * 0.5));
    var nextY = Math.max(0, Math.min(100, state.crop.origCropY - dy * 0.5));
    state.crop.currentX = nextX;
    state.crop.currentY = nextY;
    applyImageStyle(state.crop.img, nextX, nextY, state.crop.zoom);
  }

  function endCropInteraction() {
    if (!state.crop) return;
    state.crop.image.cropX = Math.round(state.crop.currentX);
    state.crop.image.cropY = Math.round(state.crop.currentY);
    state.crop.img.classList.remove("adjusting");
    state.crop = null;
    scheduleSave(350);
  }

  function buildAuthHeaders() {
    return state.managerKey ? { "x-model-repo-key": state.managerKey } : {};
  }

  function readStoredManagerKey() {
    try {
      return String(localStorage.getItem(config.managerKeyStorage || "chainandchisel-model-repo-key") || "").trim();
    } catch (error) {
      return "";
    }
  }

  function storeManagerKey(value) {
    try {
      if (value) localStorage.setItem(config.managerKeyStorage || "chainandchisel-model-repo-key", value);
      else localStorage.removeItem(config.managerKeyStorage || "chainandchisel-model-repo-key");
    } catch (error) {}
  }

  function findSeries(seriesId) {
    return (state.manifest.series || []).find(function (entry) { return entry.id === seriesId; }) || null;
  }

  function findImage(series, imageId) {
    return (series && series.images || []).find(function (entry) { return entry.id === imageId; }) || null;
  }

  function normalizeManifest(manifest) {
    var next = manifest && typeof manifest === "object" ? manifest : {};
    var series = Array.isArray(next.series) ? next.series : [];
    return {
      version: 1,
      updated_at: String(next.updated_at || ""),
      series: series.map(function (entry, index) {
        return {
          id: String(entry.id || "series_" + index).trim(),
          slug: slugify(entry.slug || entry.title || "", "series-" + (index + 1)),
          title: String(entry.title || "Untitled Series").trim().slice(0, 120),
          description: String(entry.description || "").trim().slice(0, 1600),
          created_at: String(entry.created_at || ""),
          updated_at: String(entry.updated_at || ""),
          images: Array.isArray(entry.images) ? entry.images.map(normalizeImage).filter(Boolean) : [],
          archives: Array.isArray(entry.archives) ? entry.archives.map(normalizeArchive).filter(Boolean) : []
        };
      })
    };
  }

  function normalizeImage(image, index) {
    if (!image || !image.url) return null;
    return {
      id: String(image.id || "image_" + index).trim(),
      url: String(image.url || "").trim(),
      public_id: String(image.public_id || "").trim(),
      file_name: String(image.file_name || "image").trim(),
      folder_path: String(image.folder_path || "").trim(),
      title: String(image.title || "").trim().slice(0, 120),
      description: String(image.description || "").trim().slice(0, 600),
      cropX: clampPercent(image.cropX, 50),
      cropY: clampPercent(image.cropY, 50),
      zoom: clampZoom(image.zoom, 1),
      mime_type: String(image.mime_type || "").trim(),
      bytes: Number(image.bytes || 0),
      created_at: String(image.created_at || "")
    };
  }

  function normalizeArchive(asset, index) {
    if (!asset || !asset.url) return null;
    return {
      id: String(asset.id || "archive_" + index).trim(),
      url: String(asset.url || "").trim(),
      public_id: String(asset.public_id || "").trim(),
      file_name: String(asset.file_name || "series.zip").trim(),
      mime_type: String(asset.mime_type || "application/zip").trim(),
      bytes: Number(asset.bytes || 0),
      created_at: String(asset.created_at || "")
    };
  }

  function applyImageStyle(img, cropX, cropY, zoom) {
    if (!img) return;
    var cx = clampPercent(cropX, 50);
    var cy = clampPercent(cropY, 50);
    var z = clampZoom(zoom, 1);
    img.style.objectPosition = cx + "% " + cy + "%";
    img.style.transformOrigin = cx + "% " + cy + "%";
    img.style.transform = "scale(" + z + ")";
  }

  function renderImageStyle(image) {
    var cx = clampPercent(image && image.cropX, 50);
    var cy = clampPercent(image && image.cropY, 50);
    var z = clampZoom(image && image.zoom, 1);
    return 'object-position:' + cx + '% ' + cy + '%;transform-origin:' + cx + '% ' + cy + '%;transform:scale(' + z + ');';
  }

  function buildArchivePath(image) {
    var path = String(image.folder_path || "").trim().replace(/^\/+|\/+$/g, "");
    var fileName = String(image.file_name || "image").trim() || "image";
    return path ? path + "/" + fileName : fileName;
  }

  function triggerDownload(url, fileName) {
    var anchor = document.createElement("a");
    anchor.href = url;
    if (fileName) anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(function () {
      if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
      if (String(url || "").indexOf("blob:") === 0) URL.revokeObjectURL(url);
    }, 200);
  }

  function slugify(value, fallback) {
    var slug = String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return slug || String(fallback || "series");
  }

  function clampPercent(value, fallback) {
    var number = Number(value);
    var safe = Number.isFinite(number) ? number : Number(fallback);
    return Number.isFinite(safe) ? Math.max(0, Math.min(100, Math.round(safe * 100) / 100)) : 50;
  }

  function clampZoom(value, fallback) {
    var number = Number(value);
    var safe = Number.isFinite(number) ? number : Number(fallback);
    return Number.isFinite(safe) ? Math.max(1, Math.min(2.5, Math.round(safe * 100) / 100)) : 1;
  }

  function formatBytes(bytes) {
    var size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var value = size;
    var index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return value.toFixed(value >= 10 || index === 0 ? 0 : 1) + " " + units[index];
  }

  function setStatus(message, tone) {
    if (!els.status) return;
    els.status.textContent = message || "";
    els.status.className = "mr-status" + (tone ? " " + tone : "");
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escAttr(value) {
    return esc(value).replace(/\n/g, "&#10;");
  }

  function randomId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(function (value) { return value.toString(16).padStart(2, "0"); })
      .join("");
  }

  async function fetchSeedManifest() {
    if (!config.seedManifestUrl) return null;
    try {
      var response = await fetch(config.seedManifestUrl, { cache: "no-store" });
      if (!response.ok) return null;
      var payload = await response.json();
      return normalizeManifest(payload);
    } catch (error) {
      console.error("[chain-model-repository] seed load failed:", error);
      return null;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
