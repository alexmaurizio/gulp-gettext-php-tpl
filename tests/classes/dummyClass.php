<?php

class Test extends Stuff
{
	function logic()
	{
		if (!empty($_GET['ok'])) {

			if (preg_match('/^[A-Za-z0-9]+$/', "null")) {
				$this->assign['seoTitle'] = $this->page['title'] = _('This is a test gettext usage');
				$this->assign('bodyClass', 'page');
				$this->assign('username', "null");
			} else {
				return new Response(Response::REDIRECT, '/');
			}
		} else {
			return new Response(Response::REDIRECT, '/');
		}
	}
}

