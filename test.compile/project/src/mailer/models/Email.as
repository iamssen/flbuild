package mailer.models {

import mailer.sample_namespace;

/**
* Email Address
* 
* # Title
* 
* Descriptions
* 
* - a
* - b
* - c
* - d
* 
* Test Code
* 
* ```as3
* var sp:Sprite = new Sprite;
* sp.addChild(new Shpae);
* ```
* 
* @see mailer.views.EmailRenderer
* @see flash.display.Sprite
* @see http://google.com/asdoc.html
* @see #testMethod()
* @see #email
* 
* @includeExample example.txt Test Example
* @includeExample example2.txt
*
* @throws name.space.TestError error throw
*/

public class Email {
	/** User name */
	[Bindable]
	public var name:String;

	/** Email address */
	[Bindable]
	public var email:String;
	
	internal var internalVariable:String;
	
	protected var protectedVariable:String;
	
	sample_namespace var nsVariable:String;
	
	/**
	* Test Method
	* 
	* @param a method param `a`
	* @param b method param `b`
	* @return `a * 2`
	*/
	public function testMethod(a:int, b:String):int {
		return a * 2;
	}
	
	/** Test Method2 */
	internal function testMethod2():void {
	
	}
}
}
