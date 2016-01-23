/*
 * UI2Modal - jQuery Plugin
 * Created for UI2, a custom Blue Iris web interface.
 */
/// <reference path="jquery-1.11.3.js" />

(function ($)
{
	$.fn.modal = function (options)
	{
		var dialog = new UI2Dialog(this, options);
		show(dialog);
		return dialog;
	}
	function UI2Dialog($content, options)
	{
		this.$content = $content;
		this.settings = $.extend(
			{
				// These are the default settings
				maxWidth: 999999,
				maxHeight: 999999
			}, options);
	}
	function show(self)
	{
		self.$overlay = $(document.createElement('div'));
		self.$overlay.addClass("ui2modal_overlay");
		self.$overlay.css("position", "absolute");
		self.$overlay.css("width", "100%");
		self.$overlay.css("height", "100%");
		self.$overlay.css("top", "0px");
		self.$overlay.css("left", "0px");
		self.$overlay.css("background-color", "#000000");
		self.$overlay.css("opacity", "0.3");
		self.$overlay.click(function () { self.close(self); });

		self.$dialog = $(document.createElement('div'));
		self.$dialog.addClass("ui2modal");
		self.$dialog.css("position", "absolute");
		self.$dialog.css("border", "4px ridge #377EC0");
		self.$dialog.css("background-color", "#373737");
		self.$dialog.css("color", "#DDDDDD");
		self.$dialog.css("overflow-y", "auto");
		self.$dialog.append(self.$content);

		self.$closebtn = $(document.createElement('img'));
		self.$closebtn.addClass("ui2modal_close");
		self.$closebtn.attr("src", "ui2/x.png");
		self.$closebtn.css("position", "absolute");
		self.$closebtn.css("cursor", "pointer");
		self.$closebtn.click(function () { self.close(self); });

		$("body").append(self.$overlay);
		$("body").append(self.$dialog);
		$("body").append(self.$closebtn);
		self.$content.show();

		$(window).bind("resize.ui2modal orientationchange.ui2modal", function () { onResize(self); });

		onResize(self);
	}
	UI2Dialog.prototype.close = function ()
	{
		$(window).unbind(".ui2modal");

		this.$content.hide();
		$("body").append(this.$content);

		this.$overlay.remove();
		this.$dialog.remove();
		this.$closebtn.remove();
	}
	function onResize(self)
	{
		var windowW = $(window).width();
		var windowH = $(window).height();

		var dialogW = windowW * 0.7;
		var dialogH = windowH * 0.8;

		if (dialogW < 300)
			dialogW = 300;
		if (dialogH < 150)
			dialogH = 150;

		if (dialogW > self.settings.maxWidth)
			dialogW = self.settings.maxWidth;
		if (dialogH > self.settings.maxHeight)
			dialogH = self.settings.maxHeight;

		var dialogT = ((windowH - dialogH) / 2);
		var dialogL = ((windowW - dialogW) / 2);

		self.$dialog.css("top", dialogT + "px");
		self.$dialog.css("left", dialogL + "px");
		self.$dialog.css("width", dialogW + "px");
		self.$dialog.css("height", dialogH + "px");

		self.$closebtn.css("top", (dialogT - 8) + "px");
		self.$closebtn.css("left", ((dialogL + dialogW) - 8) + "px");
	}
}(jQuery));